//
//  VDGTodayDashboardStore.m
//  DGMobile
//
//  Created by Joseph Kopinski on 2/11/15.
//  Copyright (c) 2015 Village of Downers Grove. All rights reserved.
//

#import "VDGTodayDashboardStore.h"
#import "VDGConstructionUpdateStore.h"
#import "VDGDataStore.h"
#import <UIKit/UIKit.h>

@interface VDGTodayDashboardStore () <NSURLSessionTaskDelegate>

@property (nonatomic) NSURLSession *session;

@property BOOL finishedWithDashboardUpdates;
@property BOOL newUpdates;

@property NSMutableArray *privateDashboardItems;
@property NSDictionary *privatePhoneNumbers;

@property (nonatomic, copy) void (^updateCompleted)(BOOL newData);

@end

@implementation VDGTodayDashboardStore


+ (instancetype)sharedStore
{
    static VDGTodayDashboardStore *sharedStore = nil;
    
    if (!sharedStore){
        sharedStore = [[self alloc] initPrivate];
    }
    
    return sharedStore;
}

- (instancetype)init
{
    @throw [NSException exceptionWithName:@"Singleton" reason:@"Use + [KDItemStore sharedStore]" userInfo:nil];
    
    return nil;
}

- (instancetype)initPrivate
{
    self = [super init];
    NSString *image = @"image";
    NSString *text = @"text";
    NSString *name = @"name";
    
    if (self){
        self.privateDashboardItems = [NSMutableArray arrayWithArray:@[@{name:@"traffic",image:@"Traffic",text:@"Construction Updates"},@{name:@"garbage",image:@"Garbage",text:@"Garbage"},@{name:@"water",image:@"Water",text:@"Water Restrictions"},@{name:@"utility",image:@"Utility",text:@"Utility Bills"},@{name:@"events",image:@"Events",text:@"Events this week"},@{name:@"requests",image:@"Request",text:@"View/Make Requests"},@{name:@"preferences",image:@"Settings",text:@"Preferences"}]];
        [self pullDashboardDataWithCompletionBlock:nil];
    }
    
    return self;
}

- (void)pullDashboardDataWithCompletionBlock:(void (^)(BOOL))newData
{
    if (!_session){
        NSURLSessionConfiguration *defaultConfigObject = [NSURLSessionConfiguration defaultSessionConfiguration];
        _session = [NSURLSession sessionWithConfiguration: defaultConfigObject delegate: self delegateQueue: [NSOperationQueue mainQueue]];
    }

    NSURL *url = [NSURL URLWithString:@"http://www.downers.us/public/json/app_dashboard.json"];
    NSURLRequest *req = [NSURLRequest requestWithURL:url cachePolicy:NSURLRequestReloadIgnoringCacheData timeoutInterval:60.0];
    NSURLSessionDataTask *dataTask = [_session dataTaskWithRequest:req
       completionHandler: ^( NSData *data, NSURLResponse *response, NSError *error) {
           if(error == nil)
           {
               /*NSString *dataString = [[NSString alloc] initWithData:data encoding:NSUTF8StringEncoding];
               dataString = [dataString stringByReplacingOccurrencesOfString:@"'" withString:@"\""];*/
               _dashboardData = nil;
               
               _dashboardData = [NSJSONSerialization JSONObjectWithData:data options:NSJSONReadingMutableContainers error:nil];
               
               if ([[VDGDataStore sharedStore] dataHasBeenUpdated:[_dashboardData objectForKey:@"updateTime"]]){
                   self.newUpdates = YES;
                   [[VDGConstructionUpdateStore sharedStore] updateItems:[_dashboardData objectForKey:@"construction"]];
               }
               
               if ([_dashboardData objectForKey:@"alerts"] && ![[[self.privateDashboardItems objectAtIndex:0] objectForKey:@"name"] isEqualToString:@"alerts"]){
                   NSArray *alertArray = [_dashboardData objectForKey:@"alerts"];
                   NSString *alertText = [NSString stringWithFormat:@"%lu New Alert",(long unsigned)[alertArray count]];
                   NSDictionary *alertDict = @{@"name":@"alerts",@"image":@"Alert",@"text":alertText,@"items":alertArray};
                   [self.privateDashboardItems insertObject:alertDict atIndex:0];
               } else if (![_dashboardData objectForKey:@"alerts"] && [[[self.privateDashboardItems objectAtIndex:0] objectForKey:@"name"] isEqualToString:@"alerts"]){
                   [self.privateDashboardItems removeObjectAtIndex:0];
               }
               if ([_dashboardData objectForKey:@"phone"]){
                   _privatePhoneNumbers = [_dashboardData objectForKey:@"phone"];
                   NSLog(@"Numbers: %@", _privatePhoneNumbers.description);
               }
               self.finishedWithDashboardUpdates = YES;
               [[NSNotificationCenter defaultCenter] postNotificationName:@"Dashboard" object:@"Data"];
           }
    }];
    
    [dataTask resume];
}

- (void)refreshData{
    [self pullDashboardDataWithCompletionBlock:nil];
}

- (void)refreshDataWithCompletion:(void (^)(BOOL newData))updateCompleted
{
    if (self.finishedWithDashboardUpdates){
        if (self.newUpdates){
            updateCompleted(YES);
        } else {
            updateCompleted(NO);
        }
    } else {
        [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(dashboardDataReceived) name:@"Dashboard" object:@"Data"];
        _updateCompleted = updateCompleted;
        
    }
}

- (void)dashboardDataReceived{
    if (self.updateCompleted){
        self.updateCompleted(self.newUpdates);
    }
}

- (NSDictionary *)phoneNumbers
{
    return [self.privatePhoneNumbers copy];
}

- (NSArray *)iPhoneDashboardItems
{
    return [self.privateDashboardItems copy];
}

@end
