//
//  VDGDataStore.m
//  Downers Now
//
//  Created by Joseph Kopinski on 6/1/15.
//  Copyright (c) 2015 Village of Downers Grove. All rights reserved.
//

#import "VDGDataStore.h"
#import "DataLastUpdate.h"
#import "AppDelegate.h"
#import <UIKit/UIKit.h>
#import "Reachability.h"

@interface VDGDataStore ()

@property (nonatomic, strong) NSDate *lastUpdate;
@property (nonatomic, strong) NSManagedObjectModel *model;
@property BOOL notifications;

@end

@implementation VDGDataStore

+ (instancetype) sharedStore
{
    static VDGDataStore *sharedStore;
    if (!sharedStore) {
        sharedStore = [[self alloc] initPrivate];
    }
    return sharedStore;
}

- (instancetype) init
{
    @throw [NSException exceptionWithName:@"Singleton" reason:@"Use + [VDGDataStore sharedStore]" userInfo:nil];
    return nil;
}

- (instancetype) initPrivate
{
    self = [super init];
    if (self){
        
        self.model = [NSManagedObjectModel mergedModelFromBundles:nil];
        
        NSPersistentStoreCoordinator *psc = [[NSPersistentStoreCoordinator alloc] initWithManagedObjectModel:self.model];
        
        // Where does the SQLite file go?
        NSString *path = self.itemArchivePath;
        NSURL *storeURL = [NSURL fileURLWithPath:path];
        
        NSError *error;
        if (![psc addPersistentStoreWithType:NSSQLiteStoreType
                               configuration:nil
                                         URL:storeURL
                                     options:nil
                                       error:&error]) {
            // Error with database. Remove old and then created new database
            [[NSFileManager defaultManager] removeItemAtURL:storeURL error:nil];
            [psc addPersistentStoreWithType:NSSQLiteStoreType
                               configuration:nil
                                         URL:storeURL
                                     options:nil
                                      error:&error];
            /*@throw [NSException exceptionWithName:@"OpenFailure"
                                           reason:[error localizedDescription]
                                         userInfo:nil];*/
        }
        
        // Create the managed object context
        self.context = [[NSManagedObjectContext alloc] init];
        self.context.persistentStoreCoordinator = psc;
        
        if ((![[UIApplication sharedApplication] isRegisteredForRemoteNotifications]) || ([[UIApplication sharedApplication] backgroundRefreshStatus] != UIBackgroundRefreshStatusAvailable)){
            self.notifications = NO;
        } else {
            self.notifications = YES;
        }
    }
    return self;
}

- (NSString *)itemArchivePath
{
    // Make sure that the first argument is NSDocumentDirectory
    // and not NSDocumentationDirectory
    NSArray *documentDirectories = NSSearchPathForDirectoriesInDomains(NSDocumentDirectory, NSUserDomainMask, YES);
    
    // Get the one document directory from that list
    NSString *documentDirectory = [documentDirectories firstObject];
    
    return [documentDirectory stringByAppendingPathComponent:@"store.data"];
}

- (BOOL)dataHasBeenUpdated:(NSString *)lastUpdateString
{
    Boolean newData;
    
    NSDate *lastDataUpdate = [self getDateFromString:lastUpdateString];
    
    NSFetchRequest *request = [[NSFetchRequest alloc] init];
    
    NSEntityDescription *e = [NSEntityDescription entityForName:@"DataLastUpdate"
                                         inManagedObjectContext:self.context];
    
    request.entity = e;

    NSError *error;
    NSArray *result = [self.context executeFetchRequest:request error:&error];
    if (!result) {
        [NSException raise:@"Fetch failed"
                    format:@"Reason: %@", [error localizedDescription]];
    }
    if ([result count] > 0){
        DataLastUpdate *dataUpdate = [result objectAtIndex:0];
        //[self sendNotificationWithBody:[NSString stringWithFormat:@"Last Update: %@ vs New Data Last Update: %@", [dataUpdate.lastUpdate description],[lastDataUpdate description] ]];
        if (![dataUpdate.lastUpdate isEqualToDate:lastDataUpdate])
        {
            dataUpdate.lastUpdate = lastDataUpdate;
            newData = YES;
        }
        
        
    } else {
        DataLastUpdate *dataUpdate = [NSEntityDescription insertNewObjectForEntityForName:@"DataLastUpdate"
                                                                                                    inManagedObjectContext:self.context];
        dataUpdate.lastUpdate = lastDataUpdate;
        newData = YES;
    }
    
    self.lastUpdate = lastDataUpdate;
    
    [self saveChanges];
    return newData;
}

- (BOOL)saveChanges
{
    NSError *error;
    BOOL successful = [self.context save:&error];
    if (!successful) {
        NSLog(@"Error saving: %@", [error localizedDescription]);
    }
    
    return successful;
}

- (NSDate *)getDateFromString:(NSString *)dateString
{
    NSDateFormatter *dateFormatter = [[NSDateFormatter alloc] init];
    [dateFormatter setDateFormat:@"yyyy-MM-dd HH:mm:ss"];
    return [dateFormatter dateFromString:dateString];
}

- (void)sendNotificationWithBody:(NSString *)body
{
    UILocalNotification *notif = [[UILocalNotification alloc] init];
    notif.alertTitle = @"DownersNow";
    notif.alertBody = body;
    notif.alertLaunchImage = @"AppIcon";
    [[UIApplication sharedApplication] presentLocalNotificationNow:notif];
}

- (BOOL)isConnected
{
    BOOL isInternet = NO;
    Reachability *reachability = [Reachability reachabilityWithHostName:@"google.com"];
    NetworkStatus remoteHostStatus = [reachability currentReachabilityStatus];
    
    if(remoteHostStatus == NotReachable)
    {
        isInternet =NO;
    }
    else if (remoteHostStatus == ReachableViaWWAN)
    {
        isInternet = YES;
    }
    else if (remoteHostStatus == ReachableViaWiFi)
    {
        isInternet = YES;
    }
    return isInternet;
}

@end
