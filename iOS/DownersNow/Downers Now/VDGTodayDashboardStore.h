//
//  VDGTodayDashboardStore.h
//  DGMobile
//
//  Created by Joseph Kopinski on 2/11/15.
//  Copyright (c) 2015 Village of Downers Grove. All rights reserved.
//

#import <Foundation/Foundation.h>

@interface VDGTodayDashboardStore : NSObject

@property (nonatomic, readonly) NSArray *iPhoneDashboardItems;
@property NSDictionary *dashboardData;
@property (nonatomic, readonly) NSDictionary *phoneNumbers;

+(instancetype)sharedStore;

- (void)refreshDataWithCompletion:(void (^)(BOOL))newData;
- (void)refreshData;

- (NSArray *)iPhoneDashboardItems;

@end
