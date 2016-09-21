//
//  VDGIntroWebViewController.m
//  Downers Now
//
//  Created by Joseph Kopinski on 6/11/15.
//  Copyright (c) 2015 Village of Downers Grove. All rights reserved.
//

#import "VDGIntroWebViewController.h"

@interface VDGIntroWebViewController ()

@end

@implementation VDGIntroWebViewController

- (void)viewDidLoad
{
    [super viewDidLoad];
    
    NSString *path = [[NSBundle mainBundle] bundlePath];
    NSURL *baseURL = [NSURL fileURLWithPath:path];
    [self.introWebView loadHTMLString:self.webpageHTML baseURL:baseURL];
}

- (void)didReceiveMemoryWarning {
    [super didReceiveMemoryWarning];
    // Dispose of any resources that can be recreated.
}

- (void)viewDidAppear:(BOOL)animated
{
    [UIView animateWithDuration:0.8 animations:^{
        self.introWebView.alpha = 1;
    }];
}
/*
#pragma mark - Navigation

// In a storyboard-based application, you will often want to do a little preparation before navigation
- (void)prepareForSegue:(UIStoryboardSegue *)segue sender:(id)sender {
    // Get the new view controller using [segue destinationViewController].
    // Pass the selected object to the new view controller.
}
*/

@end
