//
//  VDGHomeViewController.m
//  Downers Now
//
//  Created by Joseph Kopinski on 2/12/15.
//  Copyright (c) 2015 Village of Downers Grove. All rights reserved.
//

#import "VDGHomeViewController.h"
#import "VDGDashboardTableViewCell.h"
#import "VDGDetailViewController.h"
#import "VDGWebViewController.h"
#import "VDGTodayDashboardStore.h"
#import "VDGGenerics.h"
#import "UIColor+DownersColor.h"
#import "VDGDataStore.h"

@interface VDGHomeViewController () <UITableViewDataSource, UITableViewDelegate>

@property VDGGenerics *generics;
@property (nonatomic,copy) NSString *webAddress;
@property BOOL *updateReceived;

@end

@implementation VDGHomeViewController

#define IDIOM    UI_USER_INTERFACE_IDIOM()
#define IPAD     UIUserInterfaceIdiomPad

- (void)viewDidLoad {
    [super viewDidLoad];
    
    // Do any additional setup after loading the view.
    self.descriptions = [[NSMutableDictionary alloc] init];
    //self.dashboardTableView.hidden = true;
    self.dashboardTableView.dataSource = self;
    self.dashboardTableView.delegate = self;
    self.homeToolbar.backgroundColor = [UIColor downersBlue];
    self.generics = [[VDGGenerics alloc] init];
    [self registerForDataReceivedNotifcation];
    self.websiteButton.imageInsets =
    UIEdgeInsetsMake(20.0f, 15.0f, 15.0f, 15.0f);
    
    if (IDIOM == IPAD){
        self.tableviewLeadingConstraint.constant = 0.0;
        self.moreButton.hidden = YES;
    } else {
        self.tableviewLeadingConstraint.constant = -16.0;
    }
    
    [self showUpdatingToolbar];
}

- (void)viewWillAppear:(BOOL)animated
{
    self.navigationController.navigationBar.topItem.title = @"Downers Now";
    
    if ([UIApplication sharedApplication].applicationIconBadgeNumber > 0){
        [UIApplication sharedApplication].applicationIconBadgeNumber = 0;
    }
    
    [self.dashboardTableView reloadData];
}

- (void)viewDidAppear:(BOOL)animated
{
    if (IDIOM != IPAD){
        [UIView animateWithDuration:4.0 animations:^{
            self.moreButton.alpha = 0;
        }];
    }
    
}

- (void)didReceiveMemoryWarning {
    [super didReceiveMemoryWarning];
    // Dispose of any resources that can be recreated.
}

#pragma mark - Table view data source

- (NSInteger)numberOfSectionsInTableView:(UITableView *)tableView {
    // Return the number of sections.
    return 1;
}

- (NSInteger)tableView:(UITableView *)tableView numberOfRowsInSection:(NSInteger)section {
    // Return the number of rows in the section.
    return [[[VDGTodayDashboardStore sharedStore] iPhoneDashboardItems] count];
}

- (CGFloat)tableView:(UITableView *)tableView heightForRowAtIndexPath:(NSIndexPath *)indexPath
{
    if (IDIOM == IPAD){
        return 120.0;
    } else {
        return 95.0;
    }
}


- (UITableViewCell *)tableView:(UITableView *)tableView cellForRowAtIndexPath:(NSIndexPath *)indexPath
{
    static NSString *dashboardCellID = @"Dashboard_Item";
    
    VDGDashboardTableViewCell *dashboardCell = [tableView dequeueReusableCellWithIdentifier:dashboardCellID];
    
    NSDictionary *dashboardItem = [[[VDGTodayDashboardStore sharedStore] iPhoneDashboardItems] objectAtIndex:indexPath.row];
    
    UIImage *dashImage = [UIImage imageNamed:[dashboardItem valueForKey:@"image"]];
    dashImage = [dashImage imageWithRenderingMode:UIImageRenderingModeAlwaysTemplate];
    dashboardCell.dashboardImage.image = dashImage;
    if (IDIOM == IPAD){
        dashboardCell.dashboardText.textAlignment = NSTextAlignmentCenter;
    } else {
        dashboardCell.dashboardText.textAlignment = NSTextAlignmentLeft;
    }
     
    dashboardCell.dashboardText.text = [dashboardItem valueForKey:@"text"];
    NSDate *today = [[NSDate alloc] init];
    
    if ([[dashboardItem valueForKey:@"name"]  isEqual: @"events"]){
        dashImage = [UIImage imageNamed:@"Circle"];
        dashImage = [dashImage imageWithRenderingMode:UIImageRenderingModeAlwaysTemplate];
        dashboardCell.dashboardImage.image = dashImage;
        dashboardCell.dashboardImage.tintColor = [UIColor downersBlue];
        dashboardCell.dashboardNumber.text = [NSString stringWithFormat:@"%@",[[[VDGTodayDashboardStore sharedStore] dashboardData] valueForKey:@"event7DayCount"]];
        dashboardCell.dashboardNumber.hidden = ![[[VDGTodayDashboardStore sharedStore] dashboardData] valueForKey:@"event7DayCount"];
        dashboardCell.dashboardImage.backgroundColor = [UIColor clearColor];
    } else if ([[dashboardItem valueForKey:@"name"] isEqualToString:@"utility"]){
        dashboardCell.dashboardNumber.hidden = false;
        NSDictionary *utility = [[[VDGTodayDashboardStore sharedStore] dashboardData] valueForKey:@"utility"];
        dashImage = [UIImage imageNamed:@"Circle"];
        dashImage = [dashImage imageWithRenderingMode:UIImageRenderingModeAlwaysTemplate];
        dashboardCell.dashboardImage.image = dashImage;
        dashboardCell.dashboardImage.hidden = NO;
        if (utility){
            dashboardCell.dashboardImage.tintColor = [UIColor downersBlue];
            dashboardCell.dashboardNumber.font = [UIFont boldSystemFontOfSize:22.0f];
            dashboardCell.dashboardNumber.numberOfLines = 2;
            dashboardCell.dashboardNumber.text = [NSString stringWithFormat:@"%@\n%@",[[self.generics getCalendarMonthDateDictFromString:[utility valueForKey:@"date"]] valueForKey:@"month"],[[self.generics getCalendarMonthDateDictFromString:[utility valueForKey:@"date"]] valueForKey:@"date"]];
            dashboardCell.dashboardText.hidden = NO;
            if (IDIOM == IPAD){
                dashboardCell.dashboardText.text = [NSString stringWithFormat:@"Utility bills due for %@ of tracks",[utility valueForKey:@"side"]];
            } else {
                dashboardCell.dashboardText.text = [NSString stringWithFormat:@"Utility bills due for\n%@ of tracks",[utility valueForKey:@"side"]];
            }
            [_descriptions setValue:[utility objectForKey:@"Description"] forKey:@"utility"];
        } else {
            dashboardCell.dashboardImage.tintColor = [UIColor downersBlue];
        }
    } else if ([[dashboardItem valueForKey:@"name"] isEqualToString:@"water"]){
        NSDictionary *water = [[[VDGTodayDashboardStore sharedStore] dashboardData] valueForKey:@"water"];
        NSDateFormatter *todayFormatter = [[NSDateFormatter alloc] init];
        [todayFormatter setDateFormat:@"d"];
        NSString *todayDate = [todayFormatter stringFromDate:today];
        NSNumberFormatter *numberFormatter = [[NSNumberFormatter alloc] init];
        numberFormatter.numberStyle = NSNumberFormatterNoStyle;
        NSNumber *todayNumber = [numberFormatter numberFromString:todayDate];
        NSUserDefaults *userDefaults = [NSUserDefaults standardUserDefaults];
        if ([(NSString *)[userDefaults objectForKey:@"UserAddress"] length] > 0){
            dashboardCell.dashboardNumber.hidden = YES;
            NSString *address = [userDefaults objectForKey:@"UserAddress"];
            NSRange addressRange = [address rangeOfString:@" "];
            address = [address substringToIndex:addressRange.location];
            NSLog(@"Address: %@",address);
            NSNumber *addressNumber = [numberFormatter numberFromString:address];
            if ([addressNumber intValue] % 2 == [todayNumber intValue] % 2){
                dashboardCell.dashboardImage.tintColor = [UIColor goodStatus];
                [_descriptions setValue:[water objectForKey:@"allowed"] forKey:@"water"];
            } else {
                dashImage = [UIImage imageNamed:@"WaterNo"];
                dashImage = [dashImage imageWithRenderingMode:UIImageRenderingModeAlwaysTemplate];
                dashboardCell.dashboardImage.image = dashImage;
                dashboardCell.dashboardImage.tintColor = [UIColor redColor];
                [_descriptions setValue:[water objectForKey:@"restricted"] forKey:@"water"];

            }
            
        } else {
            dashboardCell.dashboardImage.tintColor = [UIColor iconFadeGray];
            dashboardCell.dashboardNumber.hidden = NO;
            dashboardCell.dashboardNumber.font = [UIFont boldSystemFontOfSize:22.0f];
            dashboardCell.dashboardNumber.numberOfLines = 2;
            if ([todayNumber intValue] % 2 == 0) {
                dashboardCell.dashboardNumber.text = @"EVEN\n#s";
                [_descriptions setValue:[water objectForKey:@"even"] forKey:@"water"];
            } else {
                dashboardCell.dashboardNumber.text = @"ODD\n#s";
                [_descriptions setValue:[water objectForKey:@"odd"] forKey:@"water"];
            }
        }
    } else if ([[dashboardItem valueForKey:@"name"] isEqualToString:@"garbage"]) {
        dashboardCell.dashboardNumber.hidden = YES;
        dashboardCell.dashboardText.text = @"Garbage Collection";
        NSDateFormatter *garbageFormatter = [[NSDateFormatter alloc] init];
        [garbageFormatter setDateFormat:@"yyyy'-'MM'-'dd'T'HH':'mm':'ss'"];
        NSArray *garbageArray = [[[VDGTodayDashboardStore sharedStore] dashboardData] valueForKey:@"garbage"];
        int garbageMessage = NO;
        NSDateFormatter *compareFormatter = [[NSDateFormatter alloc] init];
        [compareFormatter setDateFormat:@"yyyy'-'MM'-'dd'"];
        for (NSDictionary *garbage in garbageArray){
            if ([[compareFormatter stringFromDate:today] isEqualToString:[compareFormatter stringFromDate:[garbageFormatter dateFromString:[garbage objectForKey:@"Date"]]]]){
                dashboardCell.dashboardImage.tintColor = [UIColor warningStatus];
                dashboardCell.dashboardText.text = [NSString stringWithFormat:@"%@ - %@",[garbage objectForKey:@"Type"],[garbage objectForKey:@"Length"]];
                NSLog(@"Garbage: %@",[garbage objectForKey:@"Description"]);
                [_descriptions setValue:[garbage objectForKey:@"Description"] forKey:@"garbage"];
                garbageMessage = YES;
                break;
            }
        }
        if (!garbageMessage){
            dashboardCell.dashboardImage.tintColor = [UIColor goodStatus];
            [_descriptions setValue:[[[VDGTodayDashboardStore sharedStore] dashboardData] valueForKey:@"garbageMessage"] forKey:@"garbage"];
        }
        if (![[VDGDataStore sharedStore] isConnected]){
            dashboardCell.dashboardImage.tintColor = [UIColor downersBlue];
        }
    } else {
        dashboardCell.dashboardNumber.hidden = YES;
        dashboardCell.dashboardImage.tintColor = [UIColor downersBlue];
    }
    
    
    dashboardCell.selectionStyle = UITableViewCellSelectionStyleNone;
    
    return dashboardCell;
}

- (void)tableView:(UITableView *)tableView didSelectRowAtIndexPath:(NSIndexPath*)indexPath {
    NSDictionary *dashItem = [[[VDGTodayDashboardStore sharedStore] iPhoneDashboardItems] objectAtIndex:indexPath.row];
    
    //Build a segue string based on the selected cell
    
    NSString *segueString = [NSString stringWithFormat:@"%@-segue",
                              [dashItem valueForKey:@"name"]];
    self.descriptionItem = [dashItem valueForKey:@"name"];
    if ([segueString isEqualToString:@"garbage-segue"] || [segueString isEqualToString:@"utility-segue"] || [segueString isEqualToString:@"water-segue"]){
        segueString = @"web-segue";
    } else if ([segueString isEqualToString:@"alerts-segue"]){
        NSDictionary *alerts = [[[VDGTodayDashboardStore sharedStore] iPhoneDashboardItems] objectAtIndex:0];
        NSArray *alertsArray = (NSArray *)[alerts valueForKey:@"items"];
        segueString = @"web-segue";
        NSDictionary *alertItem = [alertsArray objectAtIndex:0];
        if ([alertItem valueForKey:@"description"]){
            NSString *descript = [alertItem valueForKey:@"description"];
            [_descriptions setValue:descript forKey:@"alerts"];
        } else if ([alertItem valueForKey:@"website"]){
            self.descriptionItem = @"website";
            [_descriptions setValue:[alertItem valueForKey:@"website"] forKey:@"alerts"];
        }
    } else if ([segueString isEqualToString:@"preferences-segue"]){
        segueString = @"pref-segue";
    }
    //Since contentArray is an array of strings, we can use it to build a unique
    //identifier for each segue.
    
    //Perform a segue.
    if (([[VDGDataStore sharedStore] isConnected] || [segueString isEqualToString:@"pref-segue"])) {
        [self performSegueWithIdentifier:segueString
                              sender:self];
    } else if ([[VDGDataStore sharedStore] isConnected] && !_updateReceived){
        [self showConnectionErrorWithTitle:@"Updating" WithMessage:@"Please wait until update has finished and try again. Thank you!"];
    } else {
        [self showConnectionErrorWithTitle:nil WithMessage:@"The device is not connected to the internet. For access this feature, please check your connection."];
    }
}

- (void)dashboardDataReceived
{
    
    //[_dashboardTableView reloadData];
    [_dashboardTableView reloadSections:[NSIndexSet indexSetWithIndex:0] withRowAnimation:UITableViewRowAnimationFade];
    //self.dashboardTableView.hidden = false;
    [self hideUpdatingToolbar];
}


#pragma mark - Navigation

// In a storyboard-based application, you will often want to do a little preparation before navigation
- (void)prepareForSegue:(UIStoryboardSegue *)segue sender:(id)sender {
    // Get the new view controller using [segue destinationViewController].
    // Pass the selected object to the new view controller.
    if ([[segue identifier] isEqualToString:@"detail"]){
        NSLog(@"DVC: %@", [[segue destinationViewController] description]);
        VDGDetailViewController *detailVC = (VDGDetailViewController *)[segue destinationViewController];
        if (self.descriptions[self.descriptionItem]){
            detailVC.detailText = _descriptions[self.descriptionItem];
        }
    } else if([[segue identifier] isEqualToString:@"web-segue"]){
        
        VDGWebViewController *webVC = (VDGWebViewController *)[segue destinationViewController];
        if ([self.descriptionItem isEqualToString:@"CRC"]){
            NSUserDefaults *defaults = [NSUserDefaults standardUserDefaults];
            NSString *userID = [defaults valueForKey:@"UserID"];
            
            if (userID && [[defaults objectForKey:@"PersonalInfo"] isEqualToNumber:@1]){
                self.webAddress = [NSString stringWithFormat:@"http://www.downers.us/forms/community-response-center?type=mobile&id=%@",userID];
            } else {
                self.webAddress = @"http://www.downers.us/forms/community-response-center";
            }
            webVC.webAddress = self.webAddress
            ;
        } else if ([self.descriptionItem isEqualToString:@"website"]){
            webVC.webAddress = @"http://www.downers.us";
        } else if ([self.descriptionItem isEqualToString:@"alert-notif"]){
            webVC.webAddress = self.notificationHtmlString;
        } else if ([self.descriptionItem isEqualToString:@"alert-notif-html"]){
            webVC.remoteNotification = YES;
        } else {
            if (self.descriptions[self.descriptionItem]){
                webVC.htmlString = _descriptions[self.descriptionItem];
            }
        }
    }
}

- (void)registerForDataReceivedNotifcation
{
    [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(dashboardDataReceived) name:@"Dashboard" object:@"Data"];
}

- (IBAction)websiteTapped:(id)sender {
    self.descriptionItem = @"website";
    [self performSegueWithIdentifier:@"web-segue" sender:self];
}

- (IBAction)refreshDataButtonPressed:(id)sender {
    [self refreshDashboardData];
}

- (void)refreshDashboardData
{
    if ([[VDGDataStore sharedStore] isConnected]) {
        [self showUpdatingToolbar];
        [self registerForDataReceivedNotifcation];
        [[VDGTodayDashboardStore sharedStore] refreshData];
    } else {
        [self showConnectionErrorWithTitle:nil WithMessage:nil];
    }
}

- (void)showUpdatingToolbar
{
    if ([[VDGDataStore sharedStore] isConnected]){
    
        [UIView animateWithDuration:1 animations:^{
            self.homeToolbar.alpha = 1;
        }];
        //Show spinner while loading
        UIActivityIndicatorView * activityView = [[UIActivityIndicatorView alloc] initWithFrame:CGRectMake(0, 0, 25, 25)];
        activityView.color = [UIColor whiteColor];
        [activityView sizeToFit];
        [activityView setAutoresizingMask:(UIViewAutoresizingFlexibleLeftMargin | UIViewAutoresizingFlexibleRightMargin | UIViewAutoresizingFlexibleTopMargin | UIViewAutoresizingFlexibleBottomMargin)];
        [activityView startAnimating];
        UIBarButtonItem *loadingView = [[UIBarButtonItem alloc] initWithCustomView:activityView];
        [self.navigationItem setRightBarButtonItem:loadingView];
    } else {
        [self showConnectionErrorWithTitle:nil WithMessage:nil];
    }
}

- (void)hideUpdatingToolbar
{
    [UIView animateWithDuration:1.5 animations:^{
        self.homeToolbar.alpha = 0;
    }];
    [self.navigationItem setRightBarButtonItem:[[UIBarButtonItem alloc] initWithBarButtonSystemItem:UIBarButtonSystemItemRefresh target:self action:@selector(refreshDashboardData)]];
    
}
- (IBAction)moreButtonPressed:(id)sender {
    CGPoint offset = CGPointMake(0, self.dashboardTableView.contentSize.height -  self.dashboardTableView.frame.size.height);
    [self.dashboardTableView setContentOffset:offset animated:YES];
}

- (void)showConnectionErrorWithTitle:(NSString *)title WithMessage:(NSString *)message
{
    if (!title){
        title = @"Connection";
    }
    
    if (!message){
        message = @"The device is not connected to the internet. For full functionality, please check your connection.";
    }
    UIAlertView *resultView = [[UIAlertView alloc] initWithTitle:title message:message delegate:nil cancelButtonTitle:@"Ok" otherButtonTitles:nil];
    [resultView show];
}
@end
