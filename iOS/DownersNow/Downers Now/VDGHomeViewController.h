//
//  VDGHomeViewController.h
//  Downers Now
//
//  Created by Joseph Kopinski on 2/12/15.
//  Copyright (c) 2015 Village of Downers Grove. All rights reserved.
//

#import <UIKit/UIKit.h>

@interface VDGHomeViewController : UIViewController
@property (weak, nonatomic) IBOutlet UITableView *dashboardTableView;
@property (weak, nonatomic) IBOutlet UIToolbar *homeToolbar;
- (IBAction)websiteTapped:(id)sender;

@property (strong, nonatomic) NSString *notificationHtmlString;
@property (strong, nonatomic) NSMutableDictionary *descriptions;
@property (strong, nonatomic) NSString *descriptionItem;
@property (weak, nonatomic) IBOutlet UIBarButtonItem *websiteButton;
@property (weak, nonatomic) IBOutlet UIView *updatingView;
- (IBAction)refreshDataButtonPressed:(id)sender;
@property (weak, nonatomic) IBOutlet UIButton *moreButton;
- (IBAction)moreButtonPressed:(id)sender;
@property (weak, nonatomic) IBOutlet NSLayoutConstraint *tableviewLeadingConstraint;

@end
