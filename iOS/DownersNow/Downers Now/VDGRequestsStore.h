//
//  VDGRequestsStore.h
//  Downers Now
//
//  Created by Joseph Kopinski on 6/11/15.
//  Copyright (c) 2015 Village of Downers Grove. All rights reserved.
//

#import <Foundation/Foundation.h>
#import "Requests.h"

@interface VDGRequestsStore : NSObject

@property (nonatomic, readonly) NSArray *allItems;

// Notice that this is a class method and prefixed with a + instead of a -
+ (instancetype)sharedStore;
- (void)updateItems:(NSArray *)requestUpdate;
- (void)createUpdateFromItem:(NSDictionary *)update;
- (void)removeItem:(Requests *)item;

- (BOOL)saveChanges;
- (void)refreshData;


@end
