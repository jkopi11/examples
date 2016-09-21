//
//  VDGEventsTableViewController.m
//  Downers Now
//
//  Created by Joseph Kopinski on 2/12/15.
//  Copyright (c) 2015 Village of Downers Grove. All rights reserved.
//

#import "VDGEventsTableViewController.h"
#import "VDGEventsTableViewCell.h"
#import "VDGTodayDashboardStore.h"
#import "VDGEventDetailViewController.h"
#import <EventKit/EventKit.h>
#import "UIColor+DownersColor.h"

@interface VDGEventsTableViewController () <UITableViewDelegate, UITableViewDataSource>

@property NSDictionary *selected;

@end

@implementation VDGEventsTableViewController

- (void)viewDidLoad {
    [super viewDidLoad];
    
    // Uncomment the following line to preserve selection between presentations.
    // self.clearsSelectionOnViewWillAppear = NO;
    
    // Uncomment the following line to display an Edit button in the navigation bar for this view controller.
    // self.navigationItem.rightBarButtonItem = self.editButtonItem;
    if ([[[VDGTodayDashboardStore sharedStore] dashboardData] count] == 0){
        _eventsTableView.hidden = true;
        /*[[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(dashboardDataReceived) name:@"Dashboard" object:@"Data"];*/
    } else {
        self.eventsTableView.dataSource = self;
        self.eventsTableView.delegate = self;
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
    
    return [[[[VDGTodayDashboardStore sharedStore] dashboardData] valueForKey:@"events"] count];
}

- (UITableViewCell *)tableView:(UITableView *)tableView cellForRowAtIndexPath:(NSIndexPath *)indexPath
{
    NSDictionary *eventItem = [[[[VDGTodayDashboardStore sharedStore] dashboardData] valueForKey:@"events"] objectAtIndex:indexPath.row];
    
    static NSString *eventCellID = @"Event";
    
    VDGEventsTableViewCell *eventCell = [tableView dequeueReusableCellWithIdentifier:eventCellID];
    
    if ([[eventItem valueForKey:@"type"]  isEqual: @"Meeting"]){
        UIImage *meetingImage = [UIImage imageNamed:@"Meeting"];
        //meetingImage = [meetingImage imageWithRenderingMode:UIImageRenderingModeAlwaysTemplate];
        eventCell.eventImage.image = meetingImage;
        //eventCell.eventImage.tintColor = [UIColor downersBlueFaded];
    } else {
        UIImage *eventImage = [UIImage imageNamed:@"Event"];
        //eventImage = [eventImage imageWithRenderingMode:UIImageRenderingModeAlwaysTemplate];
        eventCell.eventImage.image = eventImage;
        //eventCell.eventImage.tintColor = [UIColor downersBlueFaded];
    }
    
    eventCell.eventTitle.text = [eventItem valueForKey:@"title"];
    eventCell.eventLocation.text = [eventItem valueForKey:@"location"];
    eventCell.eventTime.text = [eventItem valueForKey:@"startTime"];
    
    return eventCell;
}


- (void)dashboardDataReceived
{
    self.eventsTableView.dataSource = self;
    self.eventsTableView.delegate = self;
    //[_eventsTableView reloadData];
    self.eventsTableView.hidden = false;
}

/*
- (UITableViewCell *)tableView:(UITableView *)tableView cellForRowAtIndexPath:(NSIndexPath *)indexPath {
    UITableViewCell *cell = [tableView dequeueReusableCellWithIdentifier:<#@"reuseIdentifier"#> forIndexPath:indexPath];
    
    // Configure the cell...
    
    return cell;
}
*/

/*
// Override to support conditional editing of the table view.
- (BOOL)tableView:(UITableView *)tableView canEditRowAtIndexPath:(NSIndexPath *)indexPath {
    // Return NO if you do not want the specified item to be editable.
    return YES;
}
*/

/*
// Override to support editing the table view.
- (void)tableView:(UITableView *)tableView commitEditingStyle:(UITableViewCellEditingStyle)editingStyle forRowAtIndexPath:(NSIndexPath *)indexPath {
    if (editingStyle == UITableViewCellEditingStyleDelete) {
        // Delete the row from the data source
        [tableView deleteRowsAtIndexPaths:@[indexPath] withRowAnimation:UITableViewRowAnimationFade];
    } else if (editingStyle == UITableViewCellEditingStyleInsert) {
        // Create a new instance of the appropriate class, insert it into the array, and add a new row to the table view
    }   
}
*/

/*
// Override to support rearranging the table view.
- (void)tableView:(UITableView *)tableView moveRowAtIndexPath:(NSIndexPath *)fromIndexPath toIndexPath:(NSIndexPath *)toIndexPath {
}
*/

/*
// Override to support conditional rearranging of the table view.
- (BOOL)tableView:(UITableView *)tableView canMoveRowAtIndexPath:(NSIndexPath *)indexPath {
    // Return NO if you do not want the item to be re-orderable.
    return YES;
}
*/


#pragma mark - Navigation

// In a storyboard-based application, you will often want to do a little preparation before navigation
- (void)prepareForSegue:(UIStoryboardSegue *)segue sender:(id)sender {
    // Get the new view controller using [segue destinationViewController].
    // Pass the selected object to the new view controller.
    VDGEventDetailViewController *edvc = (VDGEventDetailViewController *)[segue destinationViewController];

    NSIndexPath *index = [self.tableView indexPathForSelectedRow];
    _selected = [[[[VDGTodayDashboardStore sharedStore] dashboardData] valueForKey:@"events"] objectAtIndex:index.row];
    edvc.event = _selected;
    
    edvc.htmlString = [_selected valueForKey:@"Description"];
 
}

@end
