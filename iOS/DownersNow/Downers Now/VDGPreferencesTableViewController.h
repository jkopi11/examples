//
//  VDGPreferencesTableViewController.h
//  Downers Now
//
//  Created by Joseph Kopinski on 2/16/15.
//  Copyright (c) 2015 Village of Downers Grove. All rights reserved.
//

#import <UIKit/UIKit.h>

@interface VDGPreferencesTableViewController : UITableViewController
@property (weak, nonatomic) IBOutlet UITextField *prefPhoneNumber;
@property (weak, nonatomic) IBOutlet UITextField *prefName;
@property (weak, nonatomic) IBOutlet UITextField *prefAddress;
@property (weak, nonatomic) IBOutlet UITextField *prefEmail;
@property (weak, nonatomic) IBOutlet UISwitch *prefPersonalInfo;
@property (weak, nonatomic) IBOutlet UISwitch *prefEmailNotifications;
@property (weak, nonatomic) IBOutlet UISwitch *prefAppNotifications;
- (IBAction)showDescription:(id)sender;
@property (strong, nonatomic) IBOutlet UITableView *prefTable;

- (IBAction)preferenceChanged:(id)sender;

@end
