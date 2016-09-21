//
//  AppDelegate.h
//  Downers Now
//
//  Created by Joseph Kopinski on 2/11/15.
//  Copyright (c) 2015 Village of Downers Grove. All rights reserved.
//

#import <UIKit/UIKit.h>
#import <CoreData/CoreData.h>

@interface AppDelegate : UIResponder <UIApplicationDelegate>

@property (strong, nonatomic) UIWindow *window;

/*@property (readonly, strong, nonatomic) NSManagedObjectContext *managedObjectContext;
@property (readonly, strong, nonatomic) NSManagedObjectModel *managedObjectModel;
@property (readonly, strong, nonatomic) NSPersistentStoreCoordinator *persistentStoreCoordinator;*/
@property (readonly, strong, nonatomic) NSString *token;

@property BOOL notificationsAllowed;
@property BOOL notificationBadgeAllowed;
@property BOOL notificationSoundAllowed;
@property BOOL notificationAlertAllowed;

@property BOOL preversion8;

@property (readonly, strong, nonatomic) NSDictionary *remoteNotification;
- (void)saveContext;
- (NSURL *)applicationDocumentsDirectory;


@end

