//
//  VDGExistingRequestTableViewCell.h
//  Downers Now
//
//  Created by Joseph Kopinski on 6/12/15.
//  Copyright (c) 2015 Village of Downers Grove. All rights reserved.
//

#import <UIKit/UIKit.h>

@interface VDGExistingRequestTableViewCell : UITableViewCell
@property (weak, nonatomic) IBOutlet UILabel *requestTypeLabel;
@property (weak, nonatomic) IBOutlet UILabel *statusLabel;
@property (weak, nonatomic) IBOutlet UILabel *statusDateLabel;

@end
