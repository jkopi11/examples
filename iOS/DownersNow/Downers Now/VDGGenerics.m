//
//  VDGGenerics.m
//  Downers Now
//
//  Created by Joseph Kopinski on 2/13/15.
//  Copyright (c) 2015 Village of Downers Grove. All rights reserved.
//

#import "VDGGenerics.h"

@interface VDGGenerics()

@end

@implementation VDGGenerics

- (instancetype)init
{
    if (!self){
        self = [super init];
    }
    return self;
}

- (NSDate *)getDateFromString:(NSString *)dateString
{
    NSDateFormatter *dateFormat = [[NSDateFormatter alloc] init];
    [dateFormat setDateFormat:@"YYYY-MM-dd'T'HH:mm:ss"];
    return [dateFormat dateFromString:dateString];
}

- (NSDictionary *)getCalendarMonthDateDictFromString:(NSString *)dateString
{
    NSLog(@"Generic Date String: %@",dateString);
    NSDate *tempDate = [self getDateFromString:dateString];
    NSLog(@"Generic Date: %@",tempDate);
    NSDateFormatter *calendarDateFormatter = [[NSDateFormatter alloc] init];
    [calendarDateFormatter setDateFormat:@"d"];
    NSString *d = [calendarDateFormatter stringFromDate:tempDate];
    [calendarDateFormatter setDateFormat:@"MMM"];
    NSString *month = [calendarDateFormatter stringFromDate:tempDate];
    NSLog(@"Date: %@", [d substringFromIndex: [d length]]);
    NSString *lastChar = [d substringFromIndex: [d length]-1];
    if ([lastChar isEqualToString:@"1"]) {
        d = [NSString stringWithFormat:@"%@st",d];
    } else if ([lastChar isEqualToString:@"2"]){
        d = [NSString stringWithFormat:@"%@nd",d];
    } else if ([lastChar isEqualToString:@"3"]){
        d = [NSString stringWithFormat:@"%@rd",d];
    } else {
        d = [NSString stringWithFormat:@"%@th",d];
    }
    
    return @{@"date":d,@"month":month};
}

@end
