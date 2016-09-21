//
//  DataLastUpdate.h
//  Downers Now
//
//  Created by Joseph Kopinski on 6/1/15.
//  Copyright (c) 2015 Village of Downers Grove. All rights reserved.
//

#import <Foundation/Foundation.h>
#import <CoreData/CoreData.h>


@interface DataLastUpdate : NSManagedObject

@property (nonatomic, retain) NSDate * lastUpdate;

@end
