//
//  VDGGenerics.h
//  Downers Now
//
//  Created by Joseph Kopinski on 2/13/15.
//  Copyright (c) 2015 Village of Downers Grove. All rights reserved.
//

#import <Foundation/Foundation.h>


@interface VDGGenerics : NSObject

- (NSDate *)getDateFromString:(NSString *)dateString;
- (NSDictionary *)getCalendarMonthDateDictFromString:(NSString *)dateString;


@end
