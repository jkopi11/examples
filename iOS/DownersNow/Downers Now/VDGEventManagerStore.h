//
//  VDGEventManagerStore.h
//  Downers Now
//
//  Created by Joseph Kopinski on 2/16/15.
//  Copyright (c) 2015 Village of Downers Grove. All rights reserved.
//

//  This store is strictly to allow the app to access and handler storing items on the device's calendar

#import <Foundation/Foundation.h>
#import <EventKit/EventKit.h>

@interface VDGEventManagerStore : NSObject

+(instancetype)eventManager;

@property (nonatomic) EKEventStore *eventStore;
@property (nonatomic) BOOL eventsAccessGranted;

@end
