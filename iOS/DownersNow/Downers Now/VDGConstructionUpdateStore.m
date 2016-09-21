//
//  VDGConstructionUpdateStore.m
//  Downers Now
//
//  Created by Joseph Kopinski on 6/1/15.
//  Copyright (c) 2015 Village of Downers Grove. All rights reserved.
//

#import "VDGConstructionUpdateStore.h"
#import "VDGDataStore.h"
#import <UIKit/UIKit.h>


@interface VDGConstructionUpdateStore ()

@property (nonatomic) NSMutableArray *privateConstructionUpdates;
@property (nonatomic) NSMutableArray *privateRoadClosures;
@property (nonatomic, strong) NSManagedObjectContext *context;
@property BOOL initialStore;

@end

@implementation VDGConstructionUpdateStore

+ (instancetype) sharedStore
{
    static VDGConstructionUpdateStore *sharedStore;
    if (!sharedStore) {
        sharedStore = [[self alloc] initPrivate];
    }
    return sharedStore;
}

- (instancetype) init
{
    @throw [NSException exceptionWithName:@"Singleton" reason:@"Use + [VDGConstructionUpdateStore sharedStore]" userInfo:nil];
    return nil;
}

- (instancetype) initPrivate
{
    self = [super init];
    if (self){
        
        self.context = [[VDGDataStore sharedStore] context];
        
        [self loadAllItems];
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

- (void)loadAllItems
{
    self.privateRoadClosures = [[NSMutableArray alloc] initWithArray:@[]];
    
    if (!self.privateConstructionUpdates) {
        NSFetchRequest *request = [[NSFetchRequest alloc] init];
        
        NSEntityDescription *e = [NSEntityDescription entityForName:@"ConstructionUpdates"
                                             inManagedObjectContext:self.context];
        
        request.entity = e;
        
        NSSortDescriptor *sd = [NSSortDescriptor
                                sortDescriptorWithKey:@"pubDate"
                                ascending:NO];
        NSSortDescriptor *alertSort = [NSSortDescriptor sortDescriptorWithKey:@"alerts" ascending:NO];
        
        request.sortDescriptors = @[alertSort,sd];
        
        NSError *error;
        NSArray *result = [self.context executeFetchRequest:request error:&error];
        if (!result) {
            [NSException raise:@"Fetch failed"
                        format:@"Reason: %@", [error localizedDescription]];
        }
        
        self.privateConstructionUpdates = [[NSMutableArray alloc] initWithArray:result];
        self.initialStore = (self.privateConstructionUpdates.count == 0);
    }
}

- (void)refreshItems{
    self.privateConstructionUpdates = nil;
    [self loadAllItems];
}

- (NSArray *)allItems
{
    return [self.privateConstructionUpdates copy];
}

- (NSArray *)roadClosures
{
    return [self.privateRoadClosures copy];
}

- (void)createUpdateFromItem:(NSDictionary *)update
{
    
    ConstructionUpdates *newUpdate = [NSEntityDescription insertNewObjectForEntityForName:@"ConstructionUpdates"
                                                  inManagedObjectContext:self.context];
    newUpdate.title = [update objectForKey:@"title"];
    newUpdate.pubDate = [self getDateFromString:[update objectForKey:@"pubDate"]];
    newUpdate.link = [update objectForKey:@"link"];
    newUpdate.alerts = @0;
    // if initial run of the app then construction updates should all be shown as viewed.
    // More for asthetics at this point.
    // I probably will have to create a mark all as read button, but for now this is the easier solution.
    newUpdate.viewed = [NSNumber numberWithInt:self.initialStore];
    
    [self.privateConstructionUpdates addObject:newUpdate];
    
}

- (void)removeItem:(ConstructionUpdates *)update
{
    [self.context deleteObject:update];
    [self.privateConstructionUpdates removeObjectIdenticalTo:update];
}


// Update Items is called from the VDGTodayDashboardStore. The Dashboard Store is called from the App Delegate when the app becomes active.
// It pulls the app_dashboard.json file from the web server and parses it and then populates Core Data and subsquentally the correct store that
// references Core Data

- (void)updateItems:(NSArray *)constUpdates
{
    NSLog(@"%@",@"Update Items");
    
    NSFetchRequest *request = [[NSFetchRequest alloc] init];
    
    NSEntityDescription *e = [NSEntityDescription entityForName:@"ConstructionUpdates"
                                         inManagedObjectContext:self.context];
    
    request.entity = e;
    
    BOOL sendNotification = NO;

    for (NSDictionary *temp in constUpdates){
        NSPredicate *predicate = [NSPredicate predicateWithFormat:@"title == %@", [temp objectForKey:@"title"]];
        [request setPredicate:predicate];
        NSError *error;
        NSArray *result = [self.context executeFetchRequest:request error:&error];
        if (!result) {
            [NSException raise:@"Fetch failed"
                        format:@"Reason: %@", [error localizedDescription]];
        }
        if ([result count] > 0){
            ConstructionUpdates *update = [result objectAtIndex:0];
            if (![update.pubDate isEqualToDate:[self getDateFromString:[temp objectForKey:@"pubDate"]]]){
                update.pubDate = [self getDateFromString:[temp objectForKey:@"pubDate"]];
                update.link = [temp objectForKey:@"link"];
                update.viewed = @0;
                if ([update.alerts isEqualToNumber:@1]){
                    sendNotification = YES;
                }
            }
            if (!update.alerts){
                update.alerts = @0;
            }
        } else {
            [self createUpdateFromItem:temp];
        }
    }
    if (sendNotification){
        [self sendLocalNotification];
    }
    [self saveChanges];
}

- (NSDate *)getDateFromString:(NSString *)dateString
{
    NSDateFormatter *dateFormatter = [[NSDateFormatter alloc] init];
    [dateFormatter setDateFormat:@"yyyy-MM-dd HH:mm:ss"];
    return [dateFormatter dateFromString:dateString];
}

- (void)sendLocalNotification
{
    if ([[UIApplication sharedApplication] currentUserNotificationSettings]){
        NSLog(@"Notifications %@: ", [[[UIApplication sharedApplication] currentUserNotificationSettings] description]);
        UILocalNotification *localNotif = [[UILocalNotification alloc] init];
        localNotif.alertTitle = @"New Construction Update";
        localNotif.alertBody = @"A construction update is available.";
        localNotif.alertLaunchImage = @"AppIcon";
        localNotif.applicationIconBadgeNumber = 1;
        localNotif.soundName = UILocalNotificationDefaultSoundName;
        [[UIApplication sharedApplication] presentLocalNotificationNow:localNotif];
    }
}



@end
