//
//  VDGEventsTableViewCell.h
//  Downers Now
//
//  Created by Joseph Kopinski on 2/12/15.
//  Copyright (c) 2015 Village of Downers Grove. All rights reserved.
//

#import <UIKit/UIKit.h>

@interface VDGEventsTableViewCell : UITableViewCell
@property (weak, nonatomic) IBOutlet UITextField *eventTitle;
@property (weak, nonatomic) IBOutlet UITextField *eventLocation;
@property (weak, nonatomic) IBOutlet UITextField *eventTime;
@property (weak, nonatomic) IBOutlet UIImageView *eventImage;

@end
