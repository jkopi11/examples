//
//  VDGConstructionTableViewController.m
//  Downers Now
//
//  Created by Joseph Kopinski on 6/1/15.
//  Copyright (c) 2015 Village of Downers Grove. All rights reserved.
//

#import "VDGConstructionTableViewController.h"
#import "VDGConstructionUpdateStore.h"
#import "VDGConstructionTableViewCell.h"
#import "VDGWebViewController.h"
#import "UIColor+DownersColor.h"

#import "ConstructionUpdates.h"

@interface VDGConstructionTableViewController () <UITableViewDelegate, UITableViewDataSource>

@property (nonatomic, strong) NSString *webAddress;
@property (nonatomic, strong) NSManagedObject *update;
@end

@implementation VDGConstructionTableViewController

- (void)viewDidLoad {
    [super viewDidLoad];
    
    // Uncomment the following line to preserve selection between presentations.
    // self.clearsSelectionOnViewWillAppear = NO;
    
    // Uncomment the following line to display an Edit button in the navigation bar for this view controller.
    // self.navigationItem.rightBarButtonItem = self.editButtonItem;
    
    if ([[[VDGConstructionUpdateStore sharedStore] allItems] count] == 0){
        //_constructionTableView.hidden = true;
        self.tableView.hidden = YES;
        /*[[NSNotificationCenter defaultCenter] addObserver:self selector:@selector(dashboardDataReceived) name:@"Dashboard" object:@"Data"];*/
    } else {
        /*self.constructionTableView.dataSource = self;
        self.constructionTableView.delegate = self;*/
        self.tableView.dataSource = self;
        self.tableView.delegate = self;
    }
}

- (void)viewWillAppear:(BOOL)animated
{
    [super viewWillAppear:animated]; // clears selection
    [self.tableView reloadData];
    
    /*NSIndexPath *selectedRowIndexPath = [self.tableView indexPathForSelectedRow];
    [super viewWillAppear:animated]; // clears selection
    if (selectedRowIndexPath) {
        [self.tableView reloadRowsAtIndexPaths:@[selectedRowIndexPath] withRowAnimation:UITableViewRowAnimationNone];
    }*/
}

- (void)didReceiveMemoryWarning {
    [super didReceiveMemoryWarning];
    // Dispose of any resources that can be recreated.
}

#pragma mark - Table view data source

- (NSInteger)numberOfSectionsInTableView:(UITableView *)tableView {
    // Return the number of sections.
    if ([[[VDGConstructionUpdateStore sharedStore] roadClosures] count] > 0){
        return 2;
    } else {
        return 1;
    }
    return 0;
}

- (NSInteger)tableView:(UITableView *)tableView numberOfRowsInSection:(NSInteger)section {
    if ([[[VDGConstructionUpdateStore sharedStore] roadClosures] count] > 0){
        return 2;
    } else {
        return [[[VDGConstructionUpdateStore sharedStore] allItems] count];
    }
    // Return the number of rows in the section.
    return 0;
}

- (void)constructionDataReceived
{
    /*self.constructionTableView.dataSource = self;
    self.constructionTableView.delegate = self;
    //[_eventsTableView reloadData];
    self.constructionTableView.hidden = false;*/
    self.tableView.dataSource = self;
    self.tableView.delegate = self;
    self.tableView.hidden = NO;
}


- (UITableViewCell *)tableView:(UITableView *)tableView cellForRowAtIndexPath:(NSIndexPath *)indexPath {
    VDGConstructionTableViewCell *cell = [tableView dequeueReusableCellWithIdentifier:@"construction" forIndexPath:indexPath];
    
    NSManagedObject *update = [[[VDGConstructionUpdateStore sharedStore] allItems] objectAtIndex:[indexPath row]];
    
    cell.constructionImage.hidden = YES;
    cell.constructionTitle.text = [update valueForKey:@"title"];
    if ([[update valueForKey:@"viewed"] isEqual:@1]){
        [cell.constructionTitle setFont:[UIFont fontWithName:@"HelveticaNeue-Light" size:24.0f]];
    } else {
        [cell.constructionTitle setFont:[UIFont boldSystemFontOfSize:24.0f]];
    }
    
    if ([[update valueForKey:@"alerts"] integerValue] == 1){
        cell.accessoryType = UITableViewCellAccessoryCheckmark;
        UIImage *image =[UIImage imageNamed:@"Notification"];
        image  = [image imageWithRenderingMode:UIImageRenderingModeAlwaysTemplate];
        UIImageView *imageView = [[UIImageView alloc] initWithImage:image];
        imageView.frame = CGRectMake(0.0f, 0.0f, 20.0f, 20.0f);
        imageView.contentMode = UIViewContentModeScaleAspectFill;
        cell.accessoryView = imageView;
        cell.accessoryView.tintColor = [UIColor downersBlue];
        cell.accessoryView.alpha = 0.5;
    } else {
        cell.accessoryView = nil;
        cell.accessoryType = UITableViewCellAccessoryNone;
    }
    
    return cell;
}

- (void)tableView:(UITableView *)tableView didSelectRowAtIndexPath:(NSIndexPath*)indexPath
{
    self.update = [[[VDGConstructionUpdateStore sharedStore] allItems] objectAtIndex:[indexPath row]];
    self.webAddress = [self.update valueForKey:@"link"];
    [self.update setValue:@1 forKey:@"viewed"];
    [[VDGConstructionUpdateStore sharedStore] saveChanges];
    
    [self performSegueWithIdentifier:@"const-web-segue" sender:self];
    
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


#pragma mark - Navigation

// In a storyboard-based application, you will often want to do a little preparation before navigation
- (void)prepareForSegue:(UIStoryboardSegue *)segue sender:(id)sender {
    // Get the new view controller using [segue destinationViewController].
    // Pass the selected object to the new view controller.
    VDGWebViewController *webVC = (VDGWebViewController *)[segue destinationViewController];
    webVC.title = [self.update valueForKey:@"title"];
    webVC.webAddress = self.webAddress;
    webVC.constUpdate = self.update;
}


@end
