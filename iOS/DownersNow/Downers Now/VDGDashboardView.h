//
//  VDGDashboardView.h
//  Downers Now
//
//  Created by Joseph Kopinski on 6/3/15.
//  Copyright (c) 2015 Village of Downers Grove. All rights reserved.
//

#import <UIKit/UIKit.h>

@interface VDGDashboardView : UIView

@property (weak, nonatomic) IBOutlet UILabel *dashboardNumber;
@property (weak, nonatomic) IBOutlet UILabel *dashboardLabel;
@property (weak, nonatomic) IBOutlet UIImageView *dashboardImage;
@property (weak, nonatomic) NSString * dashboardItem;

@end
