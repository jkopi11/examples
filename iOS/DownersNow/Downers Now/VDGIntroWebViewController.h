//
//  VDGIntroWebViewController.h
//  Downers Now
//
//  Created by Joseph Kopinski on 6/11/15.
//  Copyright (c) 2015 Village of Downers Grove. All rights reserved.
//

#import <UIKit/UIKit.h>

@interface VDGIntroWebViewController : UIViewController

@property (weak, nonatomic) IBOutlet UIWebView *introWebView;
@property NSString *webpageHTML;
@property NSUInteger pageIndex;

@end
