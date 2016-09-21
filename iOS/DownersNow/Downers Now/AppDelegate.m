//
//  AppDelegate.m
//  Downers Now
//
//  Created by Joseph Kopinski on 2/11/15.
//  Copyright (c) 2015 Village of Downers Grove. All rights reserved.
//

#import "AppDelegate.h"
#import "VDGTodayDashboardStore.h"
#import "VDGRequestsStore.h"
#import "VDGDataStore.h"
#import "VDGConstructionTableViewController.h"
#import "VDGHomeViewController.h"
#import "VDGIntroViewController.h"
#import "UIColor+DownersColor.h"

@interface AppDelegate () <UIApplicationDelegate, UIAlertViewDelegate>

@property (strong, nonatomic) NSString *token;
@property (strong, nonatomic) NSDictionary *remoteNotification;
@property BOOL remoteNotificationViewed;
@property int notificationType;

@property (nonatomic) NSManagedObjectContext *managedObjectContext;
@property (nonatomic) NSManagedObjectModel *managedObjectModel;
@property (nonatomic) NSPersistentStoreCoordinator *persistentStoreCoordinator;



@end

@implementation AppDelegate

const int kVDGRemoteNotification = 1;
const int kVDGLocalNotification = 0;

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions {
    // Override point for customization after application
    [application setDelegate:self];
    
    if ([[UIApplication sharedApplication] respondsToSelector:@selector(registerUserNotificationSettings:)]){
        UIUserNotificationType types = UIUserNotificationTypeSound | UIUserNotificationTypeBadge | UIUserNotificationTypeAlert;
        UIUserNotificationSettings *notificationSettings = [UIUserNotificationSettings settingsForTypes:types categories:nil];
        [application registerUserNotificationSettings:notificationSettings];
    } else {
        [[UIApplication sharedApplication] registerForRemoteNotificationTypes:(UIRemoteNotificationTypeBadge | UIRemoteNotificationTypeSound | UIRemoteNotificationTypeAlert)];
    }

    
    UILocalNotification *localNotif = [launchOptions objectForKey:UIApplicationLaunchOptionsLocalNotificationKey];
    if (localNotif){
        if ([localNotif.alertTitle isEqualToString:@"New Construction Update"]){
            [self handleNotificationWithSegue:@"traffic-segue" toWebsite:nil withSummaryText:nil];
        }
    }
    
    if (launchOptions[UIApplicationLaunchOptionsRemoteNotificationKey]) {
        [self application:application didReceiveRemoteNotification:launchOptions[UIApplicationLaunchOptionsRemoteNotificationKey]];
    }
    
    UIPageControl *pageControl = [UIPageControl appearance];
    pageControl.pageIndicatorTintColor = [UIColor lightGrayColor];
    pageControl.currentPageIndicatorTintColor = [UIColor downersBlue];
    
    
    NSString *ver = [[UIDevice currentDevice] systemVersion];
    float ver_float = [ver floatValue];
    _preversion8 = ver_float < 8.0;
    
    return YES;
}

- (BOOL)application:(UIApplication *)application shouldSaveApplicationState:(NSCoder *)coder
{
    return YES;
}

- (BOOL)application:(UIApplication *)application shouldRestoreApplicationState:(NSCoder *)coder{
    NSUserDefaults *defaults = [NSUserDefaults standardUserDefaults];
    NSDate *lastActive = (NSDate *)[defaults valueForKey:@"LastActive"];
    if ([lastActive timeIntervalSinceNow] > 3600){
        return NO;
    }
    
    return YES;
}

- (void)applicationWillResignActive:(UIApplication *)application {
    NSUserDefaults *defaults = [NSUserDefaults standardUserDefaults];
    [defaults setObject:[[NSDate alloc] init] forKey:@"LastActive"];
    // Sent when the application is about to move from active to inactive state. This can occur for certain types of temporary interruptions (such as an incoming phone call or SMS message) or when the user quits the application and it begins the transition to the background state.
    // Use this method to pause ongoing tasks, disable timers, and throttle down OpenGL ES frame rates. Games should use this method to pause the game.
}

- (void)applicationDidEnterBackground:(UIApplication *)application {
    // Use this method to release shared resources, save user data, invalidate timers, and store enough application state information to restore your application to its current state in case it is terminated later.
    // If your application supports background execution, this method is called instead of applicationWillTerminate: when the user quits.
    [self saveContext];
    [application setMinimumBackgroundFetchInterval:UIApplicationBackgroundFetchIntervalMinimum];
}

- (void)applicationWillEnterForeground:(UIApplication *)application {
    // Called as part of the transition from the background to the inactive state; here you can undo many of the changes made on entering the background.
}

- (void)applicationDidBecomeActive:(UIApplication *)application {
    NSUserDefaults *defaults = [NSUserDefaults standardUserDefaults];
    if (![defaults objectForKey:@"Initial"]){
        UINavigationController *navigationController = (UINavigationController *)self.window.rootViewController;
        UIStoryboard *mainStoryboard = [UIStoryboard storyboardWithName:@"Main_iPhone" bundle: nil];
        VDGIntroWebViewController *controller = (VDGIntroWebViewController*)[mainStoryboard instantiateViewControllerWithIdentifier: @"Intro-View"];
        [navigationController pushViewController:controller animated:YES];
        [defaults setObject:@"Initial" forKey:@"Initial"];
    }
    
    [VDGTodayDashboardStore sharedStore];
    [VDGRequestsStore sharedStore];
}

- (void)applicationWillTerminate:(UIApplication *)application {
    // Called when the application is about to terminate. Save data if appropriate. See also applicationDidEnterBackground:.
    // Saves changes in the application's managed object context before the application terminates.
    [self saveContext];
}

- (void)application:(UIApplication *)application didReceiveLocalNotification:(UILocalNotification *)notification
{
    self.notificationType = kVDGLocalNotification;
    
    if (application.applicationState == UIApplicationStateActive && [notification.alertTitle isEqualToString:@"Construction Update"]){
        [UIApplication sharedApplication].applicationIconBadgeNumber = 1;
        UIAlertView *alert = [[UIAlertView alloc] initWithTitle:@"Construction Updates" message:@"There are new construction updates available." delegate:self cancelButtonTitle:@"Cancel" otherButtonTitles:@"View", nil];
        alert.tag = 1001;
        [alert show];
    }
}

#pragma mark - Background Fetch

- (void)application:(UIApplication *)application performFetchWithCompletionHandler:(void (^)(UIBackgroundFetchResult))completionHandler
{
    [[VDGTodayDashboardStore sharedStore] refreshDataWithCompletion:^(BOOL update){
        NSLog(@"Refresh with Data: %d",update);
        NSString *updateString = @"Data has been updated.";
        if (update){
            completionHandler(UIBackgroundFetchResultNewData);
        } else {
            updateString = @"Data was not updated.";
            completionHandler(UIBackgroundFetchResultNoData);
        }
        
        /*UILocalNotification *localNotification = [[UILocalNotification alloc] init];
        localNotification.alertTitle = @"Data Checked";
        localNotification.alertBody = updateString;
        localNotification.alertLaunchImage = @"AppIcon";
        [application presentLocalNotificationNow:localNotification];*/ 
    }];
    
}



#pragma mark - Core Data stack

@synthesize managedObjectContext = _managedObjectContext;
@synthesize managedObjectModel = _managedObjectModel;
@synthesize persistentStoreCoordinator = _persistentStoreCoordinator;

- (NSURL *)applicationDocumentsDirectory {
    // The directory the application uses to store the Core Data store file. This code uses a directory named "com.downers.mobile.Downers_Now" in the application's documents directory.
    return [[[NSFileManager defaultManager] URLsForDirectory:NSDocumentDirectory inDomains:NSUserDomainMask] lastObject];
}

- (NSManagedObjectModel *)managedObjectModel {
    // The managed object model for the application. It is a fatal error for the application not to be able to find and load its model.
    if (_managedObjectModel != nil) {
        return _managedObjectModel;
    }
    NSURL *modelURL = [[NSBundle mainBundle] URLForResource:@"Downers_Now" withExtension:@"momd"];
    _managedObjectModel = [[NSManagedObjectModel alloc] initWithContentsOfURL:modelURL];
    return _managedObjectModel;
}

- (NSPersistentStoreCoordinator *)persistentStoreCoordinator {
    // The persistent store coordinator for the application. This implementation creates and return a coordinator, having added the store for the application to it.
    if (_persistentStoreCoordinator != nil) {
        return _persistentStoreCoordinator;
    }
    
    // Create the coordinator and store
    
    _persistentStoreCoordinator = [[NSPersistentStoreCoordinator alloc] initWithManagedObjectModel:[self managedObjectModel]];
    NSURL *storeURL = [[self applicationDocumentsDirectory] URLByAppendingPathComponent:@"Downers_Now.sqlite"];
    NSError *error = nil;
    NSString *failureReason = @"There was an error creating or loading the application's saved data.";
    if (![_persistentStoreCoordinator addPersistentStoreWithType:NSSQLiteStoreType configuration:nil URL:storeURL options:nil error:&error]) {
        // Report any error we got.
        NSMutableDictionary *dict = [NSMutableDictionary dictionary];
        dict[NSLocalizedDescriptionKey] = @"Failed to initialize the application's saved data";
        dict[NSLocalizedFailureReasonErrorKey] = failureReason;
        dict[NSUnderlyingErrorKey] = error;
        error = [NSError errorWithDomain:@"YOUR_ERROR_DOMAIN" code:9999 userInfo:dict];
        // Replace this with code to handle the error appropriately.
        // abort() causes the application to generate a crash log and terminate. You should not use this function in a shipping application, although it may be useful during development.
        NSLog(@"Unresolved error %@, %@", error, [error userInfo]);
        abort();
    }
    
    return _persistentStoreCoordinator;
}


- (NSManagedObjectContext *)managedObjectContext {
    // Returns the managed object context for the application (which is already bound to the persistent store coordinator for the application.)
    if (_managedObjectContext != nil) {
        return _managedObjectContext;
    }
    
    NSPersistentStoreCoordinator *coordinator = [self persistentStoreCoordinator];
    if (!coordinator) {
        return nil;
    }
    _managedObjectContext = [[NSManagedObjectContext alloc] init];
    [_managedObjectContext setPersistentStoreCoordinator:coordinator];
    return _managedObjectContext;
}

#pragma mark - Core Data Saving support

- (void)saveContext {
    NSManagedObjectContext *managedObjectContext = [[VDGDataStore sharedStore] context];
    if (managedObjectContext != nil) {
        NSError *error = nil;
        if ([managedObjectContext hasChanges] && ![managedObjectContext save:&error]) {
            // Replace this implementation with code to handle the error appropriately.
            // abort() causes the application to generate a crash log and terminate. You should not use this function in a shipping application, although it may be useful during development.
            NSLog(@"Unresolved error %@, %@", error, [error userInfo]);
            //abort();
        }
    }
}

#pragma mark - Remote Notifications

- (void)application:(UIApplication *)application didRegisterUserNotificationSettings:(UIUserNotificationSettings *)notificationSettings
{
    _notificationsAllowed = notificationSettings.types != UIUserNotificationTypeNone;
    if (_notificationsAllowed){
        _notificationBadgeAllowed = (notificationSettings.types & UIUserNotificationTypeSound) != 0;
        if (_notificationBadgeAllowed && [UIApplication sharedApplication].applicationIconBadgeNumber > 0){
            [UIApplication sharedApplication].applicationIconBadgeNumber = 0;
        }
        _notificationAlertAllowed = (notificationSettings.types & UIUserNotificationTypeAlert) != 0;
        _notificationSoundAllowed = (notificationSettings.types & UIUserNotificationTypeSound) != 0;
    }
    NSLog(@"Notifications: %d \n Badge: %d \n Sound: %d\n Alert:%d",_notificationsAllowed,_notificationBadgeAllowed,_notificationSoundAllowed,_notificationAlertAllowed);
    
    [application registerForRemoteNotifications];
    
    /*if (_notificationsAllowed && _notificationAlertAllowed){
        UILocalNotification *testNotif = [[UILocalNotification alloc] init];
        testNotif.alertTitle = @"DownersNow";
        testNotif.alertBody = @"Test";
        if (_notificationSoundAllowed){
            testNotif.soundName = UILocalNotificationDefaultSoundName;
        }
        NSLog(@"Test Fire Date: %@", [[[NSDate alloc] initWithTimeIntervalSinceNow:10] description]);
        
        testNotif.fireDate = [[NSDate alloc] initWithTimeIntervalSinceNow:10];
        [application presentLocalNotificationNow:testNotif];
    }*/

}

- (void)application:(UIApplication *)application didRegisterForRemoteNotificationsWithDeviceToken:(NSData *)deviceToken{
    if (_preversion8){
        UIRemoteNotificationType *remoteNotifications = [application enabledRemoteNotificationTypes];
        _notificationsAllowed = remoteNotifications != UIRemoteNotificationTypeNone;
        if (_notificationsAllowed){
            _notificationBadgeAllowed = (remoteNotifications == UIRemoteNotificationTypeBadge);
            if (_notificationBadgeAllowed && [UIApplication sharedApplication].applicationIconBadgeNumber > 0){
                [UIApplication sharedApplication].applicationIconBadgeNumber = 0;
            }
            _notificationAlertAllowed = (remoteNotifications == UIRemoteNotificationTypeAlert) ;
            _notificationSoundAllowed = (remoteNotifications == UIUserNotificationTypeSound);
        }
    }
    self.token = [deviceToken description];
}

- (void)application:(UIApplication *)application didFailToRegisterForRemoteNotificationsWithError:(NSError *)error
{
    NSLog(@"Notification Error: %@",[error description]);
}

- (void)application:(UIApplication *)application didReceiveRemoteNotification:(NSDictionary *)userInfo
{
    self.notificationType = kVDGRemoteNotification;
    if ([[userInfo objectForKey:@"type"] isEqualToString:@"alert"]){
        self.remoteNotification = userInfo;
        if (application.applicationState == UIApplicationStateActive){
            UIAlertView *alert = [[UIAlertView alloc] initWithTitle:@"New Message" message:@"A new message from the Village is available." delegate:self cancelButtonTitle:@"Cancel" otherButtonTitles:@"View", nil];
            alert.tag = 1000;
            [alert show];
            application.applicationIconBadgeNumber = 1;
        } else {
            application.applicationIconBadgeNumber = 0;
            [self handleNotificationWithSegue:@"alert-segue" toWebsite:[userInfo objectForKey:@"website"] withSummaryText:[userInfo objectForKey:@"text"]];
        }
    }
}

- (void)handleNotificationWithSegue:(NSString *)segue toWebsite:(NSString *)website withSummaryText:(NSString *)summary
{
    UINavigationController *navController = (UINavigationController *)self.window.rootViewController;
    VDGHomeViewController *homeVC = (VDGHomeViewController *)[[navController viewControllers] objectAtIndex:0];
    if ([segue isEqualToString:@"alert-segue"]){
        self.remoteNotificationViewed = YES;
        segue = @"web-segue";
        if (summary){
            homeVC.descriptionItem = @"alert-notif-html";
        } else {
            homeVC.descriptionItem = @"alert-notif";
            homeVC.notificationHtmlString = website;
        }
        self.remoteNotificationViewed = YES;
    }
    [UIApplication sharedApplication].applicationIconBadgeNumber = 0;
    [homeVC performSegueWithIdentifier:segue sender:navController];
}

- (void)alertView:(UIAlertView *)alertView clickedButtonAtIndex:(NSInteger)buttonIndex
{
    if (buttonIndex == 1){
        if (self.notificationType == kVDGRemoteNotification){
            [self handleNotificationWithSegue:@"alert-segue" toWebsite:[self.remoteNotification objectForKey:@"website"] withSummaryText:[self.remoteNotification objectForKey:@"text"]];
        } else {
            [self handleNotificationWithSegue:@"traffic-segue" toWebsite:nil withSummaryText:nil];
        }
    } else {
        [UIApplication sharedApplication].applicationIconBadgeNumber = 1;
    }
}

@end
