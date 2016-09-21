//
//  VDGEventDetailViewController.m
//  Downers Now
//
//  Created by Joseph Kopinski on 2/13/15.
//  Copyright (c) 2015 Village of Downers Grove. All rights reserved.
//

#import "VDGEventDetailViewController.h"
#import "VDGEventManagerStore.h"
#import <EventKit/EventKit.h>

@interface VDGEventDetailViewController ()

@end

@implementation VDGEventDetailViewController

- (void)viewDidLoad {
    [super viewDidLoad];
    NSString *path = [[NSBundle mainBundle] bundlePath];
    NSURL *baseURL = [NSURL fileURLWithPath:path];
    [self.eventWebView loadHTMLString:self.htmlString baseURL:baseURL];
    /*_eventName.text = [_event valueForKey:@"title"];
    _eventDate.text = [_event valueForKey:@"startTime"];
    _eventLocation.text = [_event valueForKey:@"location"];
    _eventDescription.text = [_event valueForKey:@"description"];*/
    // Do any additional setup after loading the view.
    if (![_event valueForKey:@"website"]){
        _eventMoreInfo.tintColor = [UIColor colorWithRed:2/225.0f green:135/255.0f blue:86/255.0f alpha:2/10.0f];
        _eventMoreInfo.enabled = false;
        
    } else {
        _eventMoreInfo.tintColor = [UIColor whiteColor];
        _eventMoreInfo.enabled = true;
        [_eventMoreInfo setAction:@selector(openMoreInfo)];
    }
    
    [_eventDirections setAction:@selector(openDirections)];
    [_eventReminder setAction:@selector(setReminderOnNativeCalendar)];
    
}

- (void)didReceiveMemoryWarning {
    [super didReceiveMemoryWarning];
    // Dispose of any resources that can be recreated.
}

- (void)openMoreInfo
{
    NSString *moreInfo = [_event valueForKey:@"website"];
    NSLog(@"More Info: %@",moreInfo);
    [self openWebsiteWithURLString:moreInfo];
}
     
- (void)openDirections
{
    NSString *location = [NSString stringWithFormat:@"http://maps.apple.com/?q=%@",[_event valueForKey:@"location"]];
    [self openWebsiteWithURLString:location];
}

- (void)setReminderOnNativeCalendar
{
    EKEventStore *store = [[VDGEventManagerStore eventManager] eventStore];
    [store requestAccessToEntityType:EKEntityTypeEvent completion:^(BOOL granted, NSError *error) {
        if (!granted) { return; }
        EKEvent *event = [EKEvent eventWithEventStore:store];
        event.title = [_event valueForKey:@"title"];
        event.startDate = [self getDateFromString:[_event valueForKey:@"start"]];
        event.endDate = [self getDateFromString:[_event valueForKey:@"end"]];
        [event setCalendar:[store defaultCalendarForNewEvents]];
        NSError *err = nil;
        [store saveEvent:event span:EKSpanThisEvent commit:YES error:&err];
        //this is so you can access this event late
        //NSString *savedEventId = event.eventIdentifier;
        [self performSelectorOnMainThread:@selector(showAlert) withObject:nil waitUntilDone:NO];
    }];
}

- (void)openWebsiteWithURLString:(NSString *)urlString
{
    NSURL *url = [NSURL URLWithString:[urlString stringByAddingPercentEscapesUsingEncoding:NSUTF8StringEncoding]];
    NSLog(@"Url: %@",[url description]);
    [[UIApplication sharedApplication] openURL:url];
}

- (NSDate *)getDateFromString:(NSString *)dateString
{
    NSDateFormatter *dateFormat = [[NSDateFormatter alloc] init];
    [dateFormat setDateFormat:@"YYYY-MM-dd'T'HH:mm:ss"];
    return [dateFormat dateFromString:dateString];
}

- (void)showAlert
{
    UIAlertView *confirm = [[UIAlertView alloc]initWithTitle:@"Event" message:@"An appointment has been added to your calender" delegate:self cancelButtonTitle:@"OK" otherButtonTitles:nil];
    confirm.tag = 1010;
    [confirm show];
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
