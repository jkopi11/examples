//
//  VDGWebViewController.m
//  Downers Now
//
//  Created by Joseph Kopinski on 3/5/15.
//  Copyright (c) 2015 Village of Downers Grove. All rights reserved.
//

#import "VDGWebViewController.h"
#import "VDGConstructionUpdateStore.h"
#import "VDGDataStore.h"
#import "AppDelegate.h"

@interface VDGWebViewController() <UIAlertViewDelegate, UIWebViewDelegate>

@property NSURL *constructionURL;
@property BOOL *constructionPage;

@end

@implementation VDGWebViewController

- (void)viewDidLoad {
    [super viewDidLoad];
    //NSLog(@"Address: %@ -- String: %@",self.webAddress,self.htmlString);
    if (self.remoteNotification){
        NSDictionary *notif = [[NSDictionary alloc] initWithDictionary:[(AppDelegate *)[[UIApplication sharedApplication] delegate] remoteNotification]];
        self.htmlString = [NSString stringWithFormat:@"<html><link rel=\"stylesheet\" href=\"bootstrap.min.css\" type=\"text/css\"/><body><div class=\"container\"><div class=\"row\"><div class=\"col-xs-12\"><p></p><p>%@</p><p><a href=\"%@\">Please click here for more information</a></div></div></div></body></html>",[notif objectForKey:@"text"],[notif objectForKey:@"website"]];
    }
    if (self.htmlString){
        NSString *path = [[NSBundle mainBundle] bundlePath];
        NSURL *baseURL = [NSURL fileURLWithPath:path];
        [self.webView loadHTMLString:self.htmlString baseURL:baseURL];
        self.activityIndicator.hidden = YES;
    }
    if (self.webAddress){
        NSURLCache *sharedCache = [[NSURLCache alloc] initWithMemoryCapacity:1024 * 1024
                                                                diskCapacity:0
                                                                    diskPath:[NSTemporaryDirectory() stringByAppendingPathComponent:@"URLCache"]];
        [NSURLCache setSharedURLCache:sharedCache];
        [self.webView loadRequest:[[NSURLRequest alloc] initWithURL:[NSURL URLWithString:self.webAddress]]];
    }
}

- (void)viewWillAppear:(BOOL)animated{
    self.notifyButton.title = @"";
    self.notifyButton.enabled = NO;

    if (self.webAddress){
        [self.activityIndicator startAnimating];
    } else {
        self.activityIndicator.hidden = YES;
    }
}

- (void)showAlertWithTitle:(NSString *)titleText Message:(NSString *)messageText YesNO:(BOOL)yesNo
{
    UIAlertView *confirm = [[UIAlertView alloc] initWithTitle:titleText message:messageText delegate:self cancelButtonTitle:@"Ok" otherButtonTitles:nil];

    if (yesNo){
        confirm = [[UIAlertView alloc] initWithTitle:titleText message:messageText delegate:self cancelButtonTitle:@"No" otherButtonTitles:@"Yes", nil];
    }
    
    confirm.tag = 1010;
    [confirm show];
}

- (IBAction)notifyButtonPressed:(id)sender {
    if ([[VDGDataStore sharedStore] notifications]){
        [self showAlertWithTitle:[self.constUpdate valueForKey:@"title"] Message:@"Would you like to receive notifications for updates to this project?" YesNO:YES];
    } else {
        [self showAlertWithTitle:@"Notification Error" Message:@"If you wish to receive notifications, please ensure both Background App Refresh and Notifications are enabled. Thank you."  YesNO:NO];
    }
    
}

- (void)alertView:(UIAlertView *)alertView clickedButtonAtIndex:(NSInteger)buttonIndex
{
    if (self.constUpdate && ![[self.constUpdate valueForKey:@"alerts"] integerValue] == buttonIndex){
        [self.constUpdate setValue:[NSNumber numberWithInteger:buttonIndex] forKey:@"alerts"];
        [[VDGConstructionUpdateStore sharedStore] saveChanges];
    }
}

- (BOOL)webView:(UIWebView *)webView shouldStartLoadWithRequest:(NSURLRequest *)request navigationType:(UIWebViewNavigationType)navigationType {
    self.activityIndicator.hidden = NO;
    [self.activityIndicator startAnimating];
    self.webpageRefreshButton.enabled = YES;
    return YES;
}

- (void)webViewDidFinishLoad:(UIWebView *)webView
{
    self.activityIndicator.hidden = YES;
    [self.activityIndicator stopAnimating];
    if (self.webView.canGoForward || self.webView.canGoBack){
        if (self.webView.canGoBack){
            self.webpageNavigationBackButton.enabled = YES;
        }
        if (self.webView.canGoForward){
            self.webpageNavigationForwardButton.enabled = YES;
        }
    } else {
        self.webpageNavigationBackButton.enabled = NO;
        self.webpageNavigationForwardButton.enabled = NO;
    }
    
    self.webpageCancelLoadingButton.enabled = NO;
    
    if (self.constUpdate && [[[NSURL alloc] initWithString:[self.constUpdate valueForKey:@"link"]] isEqual:webView.request.URL]) {
        self.notifyButton.title = @"Set Alert";
        self.notifyButton.enabled = YES;
    } else {
        self.notifyButton.title = @"";
        self.notifyButton.enabled = NO;
    }
    
    if ([webView.request.URL isFileURL]) {
        self.webpageRefreshButton.enabled = NO;
    } else {
        self.webpageRefreshButton.enabled = YES;
    }
    
    if (_userID && [webView.request.URL.absoluteString isEqualToString:@"http://www.downers.us/forms/community-response-center?type=mobile"]){
        NSUserDefaults *defaults = [NSUserDefaults standardUserDefaults];
        if ([[defaults valueForKey:@"Anonymous"] isEqualToNumber:@0]){
            NSString *js = [NSString stringWithFormat:@"$('#Name').val('%@');$('#Address').val('%@');$('#Phone').val('%@');$('#Email').val('%@');$('#UserID').val('%@');",[defaults valueForKey:@"UserName"],[defaults valueForKey:@"UserAddress"],[defaults valueForKey:@"UserPhone"],[defaults valueForKey:@"UserEmail"],_userID];
            [webView stringByEvaluatingJavaScriptFromString:js];
        }
        
    }
}

- (void)webView:(UIWebView *)webView didFailLoadWithError:(NSError *)error{
    NSLog(@"Error: %@",[error description]);
    self.activityIndicator.hidden = YES;
    [self.activityIndicator stopAnimating];
}

- (IBAction)webpageNavigationBackButtonPressed:(id)sender
{
    [self.webView goBack];
}
- (IBAction)webpageNavigationForwardButtonPressed:(id)sender {
    [self.webView goForward];
}

- (IBAction)webpageRefreshButtonPressed:(id)sender {
    [self.webView reload];
}

- (IBAction)webpageCancelLoadingPressed:(id)sender {
    [self.webView stopLoading];
}
@end
