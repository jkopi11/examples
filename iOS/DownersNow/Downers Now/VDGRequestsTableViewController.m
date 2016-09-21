//
//  VDGRequestsTableViewController.m
//  Downers Now
//
//  Created by Joseph Kopinski on 6/12/15.
//  Copyright (c) 2015 Village of Downers Grove. All rights reserved.
//

#import "VDGRequestsTableViewController.h"
#import "VDGRequestsStore.h"
#import "Requests.h"
#import "VDGExistingRequestTableViewCell.h"
#import "VDGWebViewController.h"

@interface VDGRequestsTableViewController ()

@property (strong,nonatomic) NSString *webAddress;
@property (strong,nonatomic) NSString *htmlString;

@end

@implementation VDGRequestsTableViewController

- (void)viewDidLoad {
    [super viewDidLoad];
    
    // Uncomment the following line to preserve selection between presentations.
    // self.clearsSelectionOnViewWillAppear = NO;
    
    // Uncomment the following line to display an Edit button in the navigation bar for this view controller.
    // self.navigationItem.rightBarButtonItem = self.editButtonItem;
    
    
}

- (void)didReceiveMemoryWarning {
    [super didReceiveMemoryWarning];
    // Dispose of any resources that can be recreated.
}

- (void)viewWillAppear:(BOOL)animated
{
    [super viewWillAppear:animated];
    NSUserDefaults *defaults = [NSUserDefaults standardUserDefaults];
    NSString *userID = [defaults objectForKey:@"UserID"];
    if (userID){
        NSLog(@"%@",@"Refresh Requests");
        self.navigationItem.rightBarButtonItem = [[UIBarButtonItem alloc]
                                                  initWithBarButtonSystemItem:UIBarButtonSystemItemRefresh
                                                  target:self
                                                  action:@selector(refreshRequests)];
        [self refreshRequests];
    }
    
}

#pragma mark - Table view data source

- (NSInteger)numberOfSectionsInTableView:(UITableView *)tableView {
    // Return the number of sections.
    return 1;
}

- (NSInteger)tableView:(UITableView *)tableView numberOfRowsInSection:(NSInteger)section {
    // Return the number of rows in the section.
    return [[[VDGRequestsStore sharedStore] allItems] count]+1;
}


- (UITableViewCell *)tableView:(UITableView *)tableView cellForRowAtIndexPath:(NSIndexPath *)indexPath {
    
    if ([indexPath row] == 0){
        return [tableView dequeueReusableCellWithIdentifier:@"makeRequest"];
    }
    
    VDGExistingRequestTableViewCell *cell = (VDGExistingRequestTableViewCell *)[tableView dequeueReusableCellWithIdentifier:@"request"];
    Requests *request = [[[VDGRequestsStore sharedStore] allItems] objectAtIndex:[indexPath row]-1];
    cell.requestTypeLabel.text = request.requestType;
    cell.statusLabel.text = request.statusText;
    NSDateFormatter *todayFormatter = [[NSDateFormatter alloc] init];
    [todayFormatter setDateFormat:@"MMM d, yyyy"];
    cell.statusDateLabel.text = [todayFormatter stringFromDate:request.statusDate];
    if ([request.viewed isEqualToNumber:@1]){
        [cell.requestTypeLabel setFont:[UIFont fontWithName:@"HelveticaNeue-Light" size:24.0f]];
    } else {
        [cell.requestTypeLabel setFont:[UIFont boldSystemFontOfSize:24.0f]];
    }
    
    return cell;
}

- (void)tableView:(UITableView *)tableView didSelectRowAtIndexPath:(NSIndexPath*)indexPath
{
    if ([indexPath row] == 0){
        [self performSegueWithIdentifier:@"request-web-segue" sender:self];
    } else {
        Requests *request = (Requests*)[[[VDGRequestsStore sharedStore] allItems] objectAtIndex:[indexPath row]-1];
        [request setValue:@1 forKey:@"viewed"];
        [[VDGRequestsStore sharedStore] saveChanges];
        self.htmlString = [self createHTMLForRequest:request];
        [self performSegueWithIdentifier:@"request-web-segue" sender:self];
    }
}

- (NSString *)createHTMLForRequest:(Requests *)request
{
    NSDateFormatter *todayFormatter = [[NSDateFormatter alloc] init];
    [todayFormatter setDateFormat:@"MMM d, yyyy"];
    NSString *submittedDate = [todayFormatter stringFromDate:request.submittedDate];
    NSString *statusDate = [todayFormatter stringFromDate:request.statusDate];
    return [self wrapHTMLFor:[NSString stringWithFormat:@"<dl><dt>Request Type</dt><dd>%@</dd><dt>Request ID</dt><dd>%@</dd><dt>Submitted Date</dt><dd>%@</dd><dt>Status</dt><dd>%@</dd><dt>Status Changed On</dt><dd>%@</dd><dt>Location</dt><dd>%@</dd><dt>Description</dt><dd>%@</dd></dl>",request.requestType,request.requestID,submittedDate,request.statusText,statusDate,request.requestLocation,request.requestDescription]];
}

- (NSString *)wrapHTMLFor:(NSString *)body
{
    return [NSString stringWithFormat:@"<html><link rel=\"stylesheet\" href=\"bootstrap.min.css\" type=\"text/css\"/><body style=\"background-color:#FFFFFF;color:rgb(0,63,95);\"><div class=\"container\"><div class=\"row\"><div class=\"col-xs-12\"><p></p>%@</div></div></div></body></html>",body];
}


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

- (void)registerForDataReceivedNotifcation
{
    [[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(requestDataReceived) name:@"Requests" object:@"Data"];
}

- (void)requestDataReceived
{
    [self.tableView reloadData];
    [self.navigationItem setRightBarButtonItem:[[UIBarButtonItem alloc] initWithBarButtonSystemItem:UIBarButtonSystemItemRefresh target:self action:@selector(refreshRequests)]];
}

- (void)refreshRequests
{
    UIActivityIndicatorView * activityView = [[UIActivityIndicatorView alloc] initWithFrame:CGRectMake(0, 0, 25, 25)];
    activityView.color = [UIColor whiteColor];
    [activityView sizeToFit];
    [activityView setAutoresizingMask:(UIViewAutoresizingFlexibleLeftMargin | UIViewAutoresizingFlexibleRightMargin | UIViewAutoresizingFlexibleTopMargin | UIViewAutoresizingFlexibleBottomMargin)];
    [activityView startAnimating];
    UIBarButtonItem *loadingView = [[UIBarButtonItem alloc] initWithCustomView:activityView];
    [self.navigationItem setRightBarButtonItem:loadingView];
    [self registerForDataReceivedNotifcation];
    [[VDGRequestsStore sharedStore] refreshData];
}


#pragma mark - Navigation

// In a storyboard-based application, you will often want to do a little preparation before navigation
- (void)prepareForSegue:(UIStoryboardSegue *)segue sender:(id)sender {
    // Get the new view controller using [segue destinationViewController].
    // Pass the selected object to the new view controller.
    VDGWebViewController *webVC = (VDGWebViewController *)[segue destinationViewController];
    NSUserDefaults *defaults = [NSUserDefaults standardUserDefaults];
    NSLog(@"Requests: %@", self.htmlString);
    if (!self.htmlString){
        NSString *userID = [defaults valueForKey:@"UserID"];
        if (userID && [[defaults objectForKey:@"Anonymous"] isEqualToNumber:@0]){
            self.webAddress = @"http://www.downers.us/forms/community-response-center?type=mobile";
            webVC.userID = userID;
        } else {
            self.webAddress = @"http://www.downers.us/forms/community-response-center";
        }
        webVC.webAddress = self.webAddress
        ;
    } else {
        webVC.htmlString = self.htmlString;
    }
    

    
}


@end
