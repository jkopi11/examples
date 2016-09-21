//
//  VDGRequestsStore.m
//  Downers Now
//
//  Created by Joseph Kopinski on 6/11/15.
//  Copyright (c) 2015 Village of Downers Grove. All rights reserved.
//

#import "VDGRequestsStore.h"
#import "VDGDataStore.h"
#import "DGHttpClient.h"
#import <UIKit/UIKit.h>

@interface VDGRequestsStore ()

@property (nonatomic) NSMutableArray *privateRequests;
@property (nonatomic, strong) NSManagedObjectContext *context;

@end

@implementation VDGRequestsStore

+ (instancetype) sharedStore
{
    static VDGRequestsStore *sharedStore;
    if (!sharedStore) {
        sharedStore = [[self alloc] initPrivate];
    }
    return sharedStore;
}

- (instancetype) init
{
    @throw [NSException exceptionWithName:@"Singleton" reason:@"Use + [VDGRequests sharedStore]" userInfo:nil];
    return nil;
}

- (instancetype) initPrivate
{
    self = [super init];
    if (self){
        
        self.context = [[VDGDataStore sharedStore] context];
        NSUserDefaults *defaults = [NSUserDefaults standardUserDefaults];
        if ([defaults objectForKey:@"UserID"]){
            [self pullRequestData];
        } else {
            self.privateRequests = [[NSMutableArray alloc] initWithArray:@[]];
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

- (BOOL)saveChanges
{
    NSError *error;
    BOOL successful = [self.context save:&error];
    if (!successful) {
        NSLog(@"Error saving: %@", [error localizedDescription]);
    } else {
        [self refreshItems];
    }
    
    return successful;
}

- (void)refreshData
{
    [self pullRequestData];
}

- (void)pullRequestData
{
    NSUserDefaults *defaults = [NSUserDefaults standardUserDefaults];
    NSString *userID = [defaults objectForKey:@"UserID"];
    if (userID){
        dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
            DGHttpClient *client = [[DGHttpClient alloc] init];
            void(^completionHandler)( NSData *data, NSURLResponse *response, NSError *error) = ^( NSData *data, NSURLResponse *response, NSError *error) {
                //NSString *dataString = [[NSString alloc] initWithData:data encoding:NSUTF8StringEncoding];
                //NSLog(@"Data: %@", dataString);
                //NSLog(@"Response: %@",response.description);
                if (error){
                    NSLog(@"Error: %@",[error description]);
                }
                NSDictionary *result = [NSJSONSerialization JSONObjectWithData:data options:0 error:nil];
                //NSLog(@"Data Result: %@", result.description);
                if ([result valueForKey:@"success"]){
                    //NSLog(@"Requests: %@",[[result valueForKey:@"results"] description] );
                    [self updateItems:[result valueForKey:@"results"]];
                }
                
            };
            NSDictionary *mUserInfo = @{@"userID":userID};
            [client GET:@"http://www.downers.us/public/cgi/crc/mobile-requests-handler.py?" parameters:mUserInfo handleRefresh:YES completionHandler:completionHandler];
        });
    }
}

- (void)loadAllItems
{
    
    if (!self.privateRequests) {
        NSFetchRequest *request = [[NSFetchRequest alloc] init];
        
        NSEntityDescription *e = [NSEntityDescription entityForName:@"Requests"
                                             inManagedObjectContext:self.context];
        
        request.entity = e;
        
        NSSortDescriptor *statusSort = [NSSortDescriptor
                                sortDescriptorWithKey:@"statusDate"
                                ascending:NO];
        
        request.sortDescriptors = @[statusSort];
        
        NSError *error;
        NSArray *result = [self.context executeFetchRequest:request error:&error];
        if (!result) {
            [NSException raise:@"Fetch failed"
                        format:@"Reason: %@", [error localizedDescription]];
        }
        
        self.privateRequests = [[NSMutableArray alloc] initWithArray:result];
    }
}

- (void)refreshItems
{
    self.privateRequests = nil;
    [self loadAllItems];
}

- (NSArray *)allItems
{
    return [self.privateRequests copy];
}

- (void)createUpdateFromItem:(NSDictionary *)update
{
    
    Requests *newRequests = [NSEntityDescription insertNewObjectForEntityForName:@"Requests"
                                                                   inManagedObjectContext:self.context];
    newRequests.requestID = [update objectForKey:@"RequestID"];
    newRequests.requestType = [update objectForKey:@"RequestType"];
    newRequests.requestDescription = [update objectForKey:@"Description"];
    newRequests.statusDate = [NSDate dateWithTimeIntervalSince1970:[[update objectForKey:@"StatusDate"] doubleValue]/1000];
    newRequests.submittedDate = [NSDate dateWithTimeIntervalSince1970:[[update objectForKey:@"SubmittedDate"]doubleValue]/1000];
    newRequests.statusText = [update
                              objectForKey:@"StatusText"];
    newRequests.requestLocation = [update objectForKey:@"Location"];
    if ([newRequests.statusText isEqualToString:@"Completed"]){
        newRequests.viewed = @0;
    } else {
        newRequests.viewed = @1;
    }
    
    newRequests.alerts = @1;
    
    [self.privateRequests addObject:newRequests];
    
}

- (void)removeItem:(Requests *)request
{
    [self.context deleteObject:request];
    [self.privateRequests removeObjectIdenticalTo:request];
}

- (void)updateItems:(NSArray *)requestUpdate
{
    //NSLog(@"%@",@"Request Items");
    
    NSFetchRequest *request = [[NSFetchRequest alloc] init];
    
    NSEntityDescription *e = [NSEntityDescription entityForName:@"Requests"
                                         inManagedObjectContext:self.context];
    
    request.entity = e;
    
    BOOL sendNotification = NO;
    
    for (NSDictionary *temp in requestUpdate){
        NSPredicate *predicate = [NSPredicate predicateWithFormat:@"requestID == %@", [temp objectForKey:@"RequestID"]];
        [request setPredicate:predicate];
        NSError *error;
        NSArray *result = [self.context executeFetchRequest:request error:&error];
        if (!result) {
            [NSException raise:@"Fetch failed"
                        format:@"Reason: %@", [error localizedDescription]];
        }
        if ([result count] > 0){
            Requests *local = [result objectAtIndex:0];
            //NSLog(@"%@",[NSString stringWithFormat:@"Last Update: %@ vs New Data Last Update: %@", [local.statusDate description],[NSDate dateWithTimeIntervalSince1970:[[temp objectForKey:@"StatusDate"] doubleValue]].description]);
            if (![local.statusDate isEqualToDate:[NSDate dateWithTimeIntervalSince1970:[[temp objectForKey:@"StatusDate"] doubleValue]/1000]]){
                local.statusDate = [NSDate dateWithTimeIntervalSince1970:[[temp objectForKey:@"StatusDate"] doubleValue]/1000];
                local.statusText = [temp objectForKey:@"StatusText"];
                local.viewed = @0;
                sendNotification = YES;
                NSLog(@"%@",@"New Notification");
            }
        } else {
            [self createUpdateFromItem:temp];
        }
        
    }
    
    if (sendNotification){
        [self sendLocalNotification];
    }
    
    [self saveChanges];
    [[NSNotificationCenter defaultCenter] postNotificationName:@"Requests" object:@"Data"];
}

- (NSDate *)getDateFromString:(NSString *)dateString
{
    NSDateFormatter *dateFormatter = [[NSDateFormatter alloc] init];
    [dateFormatter setDateFormat:@"yyyy-MM-dd HH:mm:ss"];
    return [dateFormatter dateFromString:dateString];
}

- (void)sendLocalNotification
{
    UILocalNotification *localNotif = [[UILocalNotification alloc] init];
    localNotif.alertTitle = @"Request Update";
    localNotif.alertBody = @"A request you made has an update.";
    localNotif.alertLaunchImage = @"AppIcon";
    localNotif.applicationIconBadgeNumber = 1;
    localNotif.soundName = UILocalNotificationDefaultSoundName;
    [[UIApplication sharedApplication] presentLocalNotificationNow:localNotif];
}


@end
