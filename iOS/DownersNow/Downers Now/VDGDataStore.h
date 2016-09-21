//
//  VDGDataStore.h
//  Downers Now
//
//  Created by Joseph Kopinski on 6/1/15.
//  Copyright (c) 2015 Village of Downers Grove. All rights reserved.
//
//  Data Store is used to register for notifications and to check and manage whether
//  new data is available from the server.

#import <Foundation/Foundation.h>
#import <CoreData/CoreData.h>

@interface VDGDataStore : NSObject

@property (nonatomic, readonly) NSDate *lastUpdate;
@property (nonatomic, strong) NSManagedObjectContext *context;
@property (readonly) BOOL notifications;
@property (readonly) BOOL isConnected;

+ (instancetype)sharedStore;
- (BOOL)dataHasBeenUpdated:(NSDictionary *)updateDict;


@end
