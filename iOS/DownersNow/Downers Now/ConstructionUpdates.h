//
//  ConstructionUpdates.h
//  Downers Now
//
//  Created by Joseph Kopinski on 6/12/15.
//  Copyright (c) 2015 Village of Downers Grove. All rights reserved.
//

#import <Foundation/Foundation.h>
#import <CoreData/CoreData.h>


@interface ConstructionUpdates : NSManagedObject

@property (nonatomic, retain) NSNumber * alerts;
@property (nonatomic, retain) NSString * link;
@property (nonatomic, retain) NSDate * pubDate;
@property (nonatomic, retain) NSString * title;
@property (nonatomic, retain) NSNumber * updated;
@property (nonatomic, retain) NSNumber * viewed;

@end
