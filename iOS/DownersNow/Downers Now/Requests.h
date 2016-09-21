//
//  Requests.h
//  Downers Now
//
//  Created by Joseph Kopinski on 6/29/15.
//  Copyright (c) 2015 Village of Downers Grove. All rights reserved.
//

#import <Foundation/Foundation.h>
#import <CoreData/CoreData.h>


@interface Requests : NSManagedObject

@property (nonatomic, retain) NSNumber * alerts;
@property (nonatomic, retain) NSString * requestDescription;
@property (nonatomic, retain) NSString * requestID;
@property (nonatomic, retain) NSString * requestType;
@property (nonatomic, retain) NSDate * statusDate;
@property (nonatomic, retain) NSString * statusText;
@property (nonatomic, retain) NSDate * submittedDate;
@property (nonatomic, retain) NSNumber * viewed;
@property (nonatomic, retain) NSString * requestLocation;

@end
