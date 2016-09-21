//
//  VDGEventManagerStore.m
//  Downers Now
//
//  Created by Joseph Kopinski on 2/16/15.
//  Copyright (c) 2015 Village of Downers Grove. All rights reserved.
//

//  This store is strictly to allow the app to access and handler storing items on the device's calendar

#import "VDGEventManagerStore.h"

@implementation VDGEventManagerStore

+ (instancetype)eventManager
{
    static VDGEventManagerStore *eventManager = nil;
    
    if (!eventManager){
        eventManager = [[self alloc] initPrivate];
    }
    
    return eventManager;
}

- (instancetype)init
{
    @throw [NSException exceptionWithName:@"Singleton" reason:@"Use + [VDGEventManagerStore sharedStore]" userInfo:nil];
    
    return nil;
}

- (instancetype)initPrivate
{
    self = [super init];
    
    self.eventStore = [[EKEventStore alloc] init];
    
    return self;
}

@end
