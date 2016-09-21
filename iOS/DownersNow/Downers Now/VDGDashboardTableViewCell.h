//
//  VDGDashboardTableViewCell.h
//  Downers Now
//
//  Created by Joseph Kopinski on 2/11/15.
//  Copyright (c) 2015 Village of Downers Grove. All rights reserved.
//

#import <UIKit/UIKit.h>

@interface VDGDashboardTableViewCell : UITableViewCell

@property (weak, nonatomic) IBOutlet UIImageView *dashboardImage;
@property (weak, nonatomic) IBOutlet UILabel *dashboardText;
@property (weak, nonatomic) IBOutlet UILabel *dashboardNumber;

@end
