//
//  UIColor+DownersColor.m
//  Downers Now
//
//  Created by Joseph Kopinski on 3/5/15.
//  Copyright (c) 2015 Village of Downers Grove. All rights reserved.
//

#import "UIColor+DownersColor.h"

@implementation UIColor (DownersColor)

+ (UIColor *)downersBlue {
    return [UIColor colorWithRed:0/255.0 green:63/255.0 blue:95/255.0 alpha:1.0];
}

+ (UIColor *)downersGreen {
    return [UIColor colorWithRed:4/255.0 green:140/255.0 blue:90/255.0 alpha:1.0];
}

+ (UIColor *)goodStatus {
    return [UIColor colorWithRed:0/255.0 green:102/255.0 blue:51/255.0 alpha:1.0];
}

+ (UIColor *)iconFadeGray{
    return [UIColor colorWithRed:225/255.0f green:225/255.0f blue:225/255.0f alpha:1.0f];
}

+ (UIColor *)warningStatus {
    return [UIColor colorWithRed:178/255.0f green:121/255.0f blue:9/255.0f alpha:1.0f];
}

+ (UIColor *)downersBlueFaded
{
    return [UIColor colorWithRed:21/255.0f green:60/255.0f blue:86/255.0f alpha:1.0f];
}
@end
