//
//  VDGConstructionUpdateStore.h
//  Downers Now
//
//  Created by Joseph Kopinski on 6/1/15.
//  Copyright (c) 2015 Village of Downers Grove. All rights reserved.
//

#import <CoreData/CoreData.h>
#import "ConstructionUpdates.h"

@interface VDGConstructionUpdateStore : NSObject

@property (nonatomic, readonly) NSArray *allItems;
@property (nonatomic, readonly) NSArray *roadClosures;

// Notice that this is a class method and prefixed with a + instead of a -
+ (instancetype)sharedStore;
- (void)updateItems:(NSDictionary *)constUpdates;
- (void)createUpdateFromItem:(NSDictionary *)update;
- (void)removeItem:(ConstructionUpdates *)item;

- (BOOL)saveChanges;

@end
