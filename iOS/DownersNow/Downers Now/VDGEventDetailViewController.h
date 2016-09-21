//
//  VDGEventDetailViewController.h
//  Downers Now
//
//  Created by Joseph Kopinski on 2/13/15.
//  Copyright (c) 2015 Village of Downers Grove. All rights reserved.
//

#import <UIKit/UIKit.h>

@interface VDGEventDetailViewController : UIViewController <UIAlertViewDelegate>

@property (weak, nonatomic) IBOutlet UIBarButtonItem *eventDirections;
@property (weak, nonatomic) IBOutlet UIBarButtonItem *eventReminder;
@property (weak, nonatomic) IBOutlet UIBarButtonItem *eventMoreInfo;
@property (weak, nonatomic) IBOutlet UIToolbar *eventToolbar;
@property (weak, nonatomic) NSDictionary *event;
@property (weak, nonatomic) IBOutlet UIWebView *eventWebView;
@property (nonatomic,strong) NSString *htmlString;



@end
