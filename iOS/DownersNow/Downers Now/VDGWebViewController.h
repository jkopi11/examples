//
//  VDGWebViewController.h
//  Downers Now
//
//  Created by Joseph Kopinski on 3/5/15.
//  Copyright (c) 2015 Village of Downers Grove. All rights reserved.
//

#import <UIKit/UIKit.h>
#import <CoreData/CoreData.h>

@interface VDGWebViewController : UIViewController

@property (weak, nonatomic) IBOutlet UIWebView *webView;

@property (weak, nonatomic) NSString *htmlString;
@property (weak, nonatomic) NSString *webAddress;
@property (weak, nonatomic) NSString *viewTitle;

@property (weak, nonatomic) NSString *userID;

@property BOOL remoteNotification;
@property (strong, nonatomic) NSManagedObject *constUpdate;
@property (weak, nonatomic) IBOutlet UIActivityIndicatorView *activityIndicator;

// Web View Toolbar
@property (weak, nonatomic) IBOutlet UIToolbar *notificationToolbar;
- (IBAction)notifyButtonPressed:(id)sender;
- (IBAction)webpageNavigationBackButtonPressed:(id)sender;
- (IBAction)webpageNavigationForwardButtonPressed:(id)sender;
- (IBAction)webpageRefreshButtonPressed:(id)sender;
- (IBAction)webpageCancelLoadingPressed:(id)sender;
@property (weak, nonatomic) IBOutlet UIBarButtonItem *webpageNavigationBackButton;
@property (weak, nonatomic) IBOutlet UIBarButtonItem *webpageNavigationForwardButton;
@property (weak, nonatomic) IBOutlet UIBarButtonItem *webpageRefreshButton;
@property (weak, nonatomic) IBOutlet UIBarButtonItem *webpageCancelLoadingButton;
@property (weak, nonatomic) IBOutlet UIBarButtonItem *notifyButton;


@end
