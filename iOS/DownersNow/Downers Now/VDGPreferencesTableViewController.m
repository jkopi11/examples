//
//  VDGPreferencesTableViewController.m
//  Downers Now
//
//  Created by Joseph Kopinski on 2/16/15.
//  Copyright (c) 2015 Village of Downers Grove. All rights reserved.
//

#import "VDGPreferencesTableViewController.h"
#import "DGHttpClient.h"
#import "AppDelegate.h"
#import "VDGTodayDashboardStore.h"
#import "VDGDataStore.h"

@interface VDGPreferencesTableViewController () <UITextFieldDelegate, UIAlertViewDelegate>

@property (nonatomic,strong) NSUserDefaults *defaults;

@property BOOL needToBeSaved;


@end

@implementation VDGPreferencesTableViewController

#define IDIOM    UI_USER_INTERFACE_IDIOM()
#define IPAD     UIUserInterfaceIdiomPad

static NSString *userId = @"UserID";
static NSString *userName = @"UserName";
static NSString *userPhone = @"UserPhone";
static NSString *userAddress = @"UserAddress";
static NSString *userEmail = @"UserEmail";
static NSString *anonymous = @"Anonymous";
static NSString *emailNotif = @"EmailNotif";
static NSString *appNotif = @"AppNotif";

- (void)viewDidLoad {
    [super viewDidLoad];
    
    
    

    self.defaults = [NSUserDefaults standardUserDefaults];
    self.prefName.text = [_defaults objectForKey:userName];
    self.prefPhoneNumber.text = [_defaults objectForKey:userPhone];
    self.prefAddress.text = [_defaults objectForKey:userAddress];
    self.prefEmail.text = [_defaults objectForKey:userEmail];
    if ([_defaults objectForKey:anonymous]){
        self.prefPersonalInfo.on = [[_defaults objectForKey:anonymous] isEqualToNumber:@1];
    } else {
        self.prefPersonalInfo.on = YES;
    }
    
    self.prefEmailNotifications.on = [[_defaults objectForKey:emailNotif] isEqualToNumber:@1];
    self.prefAppNotifications.on = [[_defaults objectForKey:appNotif] isEqualToNumber:@1];
    
    self.navigationItem.hidesBackButton = YES;
    
    UIBarButtonItem *backButton = [[UIBarButtonItem alloc]
                                   initWithTitle: @"Back"
                                   style:UIBarButtonItemStylePlain
                                   target:self
                                   action:@selector(goHome)];
    self.navigationItem.leftBarButtonItem = backButton;
    
    self.needToBeSaved = [self.defaults objectForKey:@"prefneedsaved"];
    if (self.needToBeSaved){
        [self setSaveButton];
    }
    
    
    // Uncomment the following line to preserve selection between presentations.
    // self.clearsSelectionOnViewWillAppear = NO;
    
    // Uncomment the following line to display an Edit button in the navigation bar for this view controller.
    // self.navigationItem.rightBarButtonItem = self.editButtonItem;
}

- (void)viewDidAppear:(BOOL)animated
{
    //[self.prefName becomeFirstResponder];
    self.prefName.delegate = self;
    self.prefPhoneNumber.delegate = self;
    self.prefEmail.delegate = self;
    self.prefAddress.delegate = self;
}

- (void)viewWillDisappear:(BOOL)animated
{
    self.navigationController.navigationBar.topItem.title = @"";
}

- (void)savePreferences
{
    int count = 0;
    NSDictionary *preferences = @{userName:self.prefName.text,userPhone:self.prefPhoneNumber.text,userAddress:self.prefAddress.text,userEmail:self.prefEmail.text,anonymous:(self.prefPersonalInfo.on ? @1 : @0),emailNotif:(self.prefEmailNotifications.on ? @1 : @0),appNotif:(self.prefAppNotifications.on ? @1 : @0)};
    for (NSString *k in preferences) {
        count += [self updatePreferenceForKey:k from:[preferences objectForKey:k]];
    }
    
    if (count > 0){
        [self updateUserInfoWithDictionary:preferences];
    }
    _needToBeSaved = NO;
    self.navigationItem.rightBarButtonItem.title = @"Saved";
    [self.navigationItem.rightBarButtonItem setEnabled:NO];
}

-(BOOL)textFieldShouldReturn:(UITextField*)textField
{
    NSInteger nextTag = textField.tag + 1;
    // Try to find next responder
    UIResponder* nextResponder = [self.prefTable viewWithTag:nextTag];
    if (nextResponder) {
        // Found next responder, so set it.
        [nextResponder becomeFirstResponder];
    } else {
        // Not found, so remove keyboard.
        [textField resignFirstResponder];
    }
    return NO; // We do not want UITextField to insert line-breaks.
}

- (int)updatePreferenceForKey:(NSString *)key from:(NSObject *)object
{
    int update = 0;
    if (!self.defaults){
        self.defaults = [NSUserDefaults standardUserDefaults];
    }
    if (![[self.defaults objectForKey:key] isEqual:object]){
        [self.defaults setObject:object forKey:key];
        update = 1;
    }
    return update;
}

- (void)updateUserInfoWithDictionary:(NSDictionary *)userInfo
{
    // Update Dictionary -- Combine Preferences, Add UserID (if exists)
    NSMutableDictionary *mUserInfo = [userInfo mutableCopy];
    
    
    // If PersonalInfo is not 1 then delete the keys for that information
    NSArray *personalInfo = @[userName,userPhone,userEmail];
    for (NSString *p in personalInfo){
        if (![p isEqualToString:userEmail]){
            if ([[mUserInfo objectForKey:anonymous] isEqualToNumber:@1]){
                [mUserInfo removeObjectForKey:p];
            }
        } else {
            if ([[mUserInfo objectForKey:anonymous] isEqualToNumber:@1] && [[mUserInfo objectForKey:emailNotif] isEqualToNumber:@0]){
                [mUserInfo removeObjectForKey:p];
            }
        }
    }
    NSDictionary *appPreferences = @{anonymous:@"PI",emailNotif:@"EN",appNotif:@"AN"};
    NSString *enabledNotifications = @"";
    // Check each of the preferences to see which data should be included in the update to the server
    // I was using a loop, but it was much easier reading the if statements to know when to include certain pieces of data
    /*for (NSString *pref in appPreferences){
        if ((![pref isEqualToString:anonymous] && [(NSNumber*)[mUserInfo objectForKey:pref] isEqualToNumber:@0]) || ([pref isEqualToString:anonymous] && [(NSNumber*)[mUserInfo objectForKey:pref] isEqualToNumber:@0])){
            if ([enabledNotifications length] > 0){
                enabledNotifications = [enabledNotifications stringByAppendingString:@"|"];
            }
            enabledNotifications = [enabledNotifications stringByAppendingString:[appPreferences objectForKey:pref]];
        }
        [mUserInfo removeObjectForKey:pref];
    }*/
    // Disabled remain anonymous
    if ([(NSNumber *)[mUserInfo objectForKey:anonymous] isEqualToNumber:@0]){
        if ([enabledNotifications length] > 0){
            enabledNotifications = [enabledNotifications stringByAppendingString:@"|"];
        }
        enabledNotifications = [enabledNotifications stringByAppendingString:@"PI"];
    } else {
        [mUserInfo removeObjectForKey:@"UserName"];
        [mUserInfo removeObjectForKey:@"UserAddress"];
        [mUserInfo removeObjectForKey:@"UserPhone"];
        [mUserInfo removeObjectForKey:@"UserEmail"];
    }
    
    // Enabled Email Notifications
    if ([(NSNumber *)[mUserInfo objectForKey:emailNotif] isEqualToNumber:@1]){
        if ([enabledNotifications length] > 0){
            enabledNotifications = [enabledNotifications stringByAppendingString:@"|"];
        }
        enabledNotifications = [enabledNotifications stringByAppendingString:@"EN"];
        if (![mUserInfo objectForKey:@"UserEmail"]){
            [mUserInfo setObject:self.prefEmail.text forKey:@"UserEmail"];
        }
    }
    
    // Enabled App Notifications
    if ([(NSNumber *)[mUserInfo objectForKey:emailNotif] isEqualToNumber:@1]){
        if ([enabledNotifications length] > 0){
            enabledNotifications = [enabledNotifications stringByAppendingString:@"|"];
        }
        enabledNotifications = [enabledNotifications stringByAppendingString:@"AN"];
        if (![mUserInfo objectForKey:@"UserAddress"]){
            [mUserInfo setObject:self.prefAddress.text forKey:@"UserAddress"];
        }
    }
    
    [mUserInfo removeObjectForKey:anonymous];
    [mUserInfo removeObjectForKey:emailNotif];
    [mUserInfo removeObjectForKey:appNotif];
    
    if ([self.defaults objectForKey:userId]){
        [mUserInfo setObject:[self.defaults objectForKey:userId] forKey:userId];
    }
    
    [mUserInfo setObject:enabledNotifications forKey:@"EnabledNotificationTypes"];
    NSString *uploadType = @"new";
    if ([mUserInfo objectForKey:userId]){
        uploadType = @"update";
    }
    [mUserInfo setObject:uploadType forKey:@"type"];
    AppDelegate *appDelegate = (AppDelegate *)[[UIApplication sharedApplication] delegate];
    [mUserInfo setObject:appDelegate.token forKey:@"Mobile"];
    
    if ([(NSNumber *)[_defaults objectForKey:anonymous] isEqualToNumber:@0] || [(NSNumber *)[_defaults objectForKey:emailNotif] isEqualToNumber:@1] || [(NSNumber *)[_defaults objectForKey:appNotif] isEqualToNumber:@1]){
        if ([[VDGDataStore sharedStore] isConnected]){
            dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_DEFAULT, 0), ^{
                DGHttpClient *client = [[DGHttpClient alloc] init];
                void(^completionHandler)( NSData *data, NSURLResponse *response, NSError *error) = ^( NSData *data, NSURLResponse *response, NSError *error) {
                    //NSString *dataString = [[NSString alloc] initWithData:data encoding:NSUTF8StringEncoding];
                    //NSLog(@"Data: %@", dataString);
                    NSLog(@"Response: %@",response.description);
                    [self.defaults setObject:@NO forKey:@"prefneedsaved"];
                    if (error){
                        NSLog(@"Error: %@",[error description]);
                    }
                    NSDictionary *result = [NSJSONSerialization JSONObjectWithData:data options:0 error:nil];
                    NSLog(@"Data Result: %@", result.description);

                    if ([[result valueForKey:@"success"] isEqualToNumber:@0]){
                        NSString *message = [result valueForKey:@"message"];
                        UIAlertView *resultView = [[UIAlertView alloc] initWithTitle:@"Preferences" message:message delegate:self cancelButtonTitle:nil otherButtonTitles:@"Call Village",@"Ok", nil];
                        if (IDIOM == IPAD){
                            resultView = [[UIAlertView alloc] initWithTitle:@"Preferences" message:message delegate:self cancelButtonTitle:nil otherButtonTitles:@"Ok", nil];
                        }
                        [resultView show];
                    }else {
                        [self.defaults setObject:[result valueForKey:userId] forKey:userId];
                    }
                    
                };
                [client GET:@"http://www.downers.us/public/cgi/crc/device-handler.py?" parameters:mUserInfo handleRefresh:YES completionHandler:completionHandler];
            });
        } else {
            [self.defaults setObject:@YES forKey:@"prefneedsaved"];
            UIAlertView *resultView = [[UIAlertView alloc] initWithTitle:@"Connection" message:@"The device is not connected to the internet. Your preferences will only be saved to the device." delegate:nil cancelButtonTitle:@"Ok" otherButtonTitles:nil];
            [resultView show];
        }
    }
}

- (void)didReceiveMemoryWarning {
    [super didReceiveMemoryWarning];
    // Dispose of any resources that can be recreated.
}

- (BOOL)getBooleanFromNumber:(NSNumber *)number {
    return [number isEqual: @1];
}

- (IBAction)preferenceChanged:(id)sender {
    [self setSaveButton];
}

- (void)setSaveButton
{
    _needToBeSaved = YES;
    UIBarButtonItem *saveButton = [[UIBarButtonItem alloc]
                                   initWithTitle:@"Save"
                                   style:UIBarButtonItemStylePlain
                                   target:self
                                   action:@selector(savePreferences)];
    self.navigationItem.rightBarButtonItem = saveButton;
}

// Restrict phone textField to format 123-456-7890
- (BOOL)textField:(UITextField *)textField shouldChangeCharactersInRange:(NSRange)range replacementString:(NSString *)string {
    if (!_needToBeSaved){
        [self setSaveButton];
        
    }
    if (textField.tag == 102){
        // All digits entered
        if (range.location == 12) {
            return NO;
        }
        
        // Reject appending non-digit characters
        if (range.length == 0 &&
            ![[NSCharacterSet decimalDigitCharacterSet] characterIsMember:[string characterAtIndex:0]]) {
            return NO;
        }
        
        // Auto-add hyphen and parentheses
        if (range.length == 0 && range.location == 3) {
            textField.text = [NSString stringWithFormat:@"%@-%@", textField.text,string];
            return NO;
        }
        /*if (range.length == 0 && range.location == 4 &&[[textField.text substringToIndex:1] isEqualToString:@"("]) {
            textField.text = [NSString stringWithFormat:@"%@)-%@", textField.text,string];
            return NO;
        }*/
        
        // Auto-add 2nd hyphen
        if (range.length == 0 && range.location == 7) {
            textField.text = [NSString stringWithFormat:@"%@-%@", textField.text, string];
            return NO;
        }
        
        // Delete hyphen and parentheses when deleting its trailing digit
        if (range.length == 1 &&
            (range.location == 10 || range.location == 1)){
            range.location--;
            range.length = 2;
            textField.text = [textField.text stringByReplacingCharactersInRange:range withString:@""];
            return NO;
        }
        if (range.length == 1 && range.location == 6){
            range.location=range.location-2;
            range.length = 3;
            textField.text = [textField.text stringByReplacingCharactersInRange:range withString:@""];
            return NO;
        }
    }
    return YES;
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

/*
#pragma mark - Navigation

// In a storyboard-based application, you will often want to do a little preparation before navigation
- (void)prepareForSegue:(UIStoryboardSegue *)segue sender:(id)sender {
    // Get the new view controller using [segue destinationViewController].
    // Pass the selected object to the new view controller.
}
*/

- (void)goHome{
    if (_needToBeSaved){
        UIAlertView *alert = [[UIAlertView alloc] initWithTitle:@"Save Changes" message:@"There are unsaved changes. Would you like to save now?" delegate:self cancelButtonTitle:@"No" otherButtonTitles:@"Yes", nil];
        alert.tag = 1001;
        [alert show];
        return;
    }
    UINavigationController *navController = (UINavigationController *)self.navigationController;
    [navController popToRootViewControllerAnimated:YES];
}

- (void)alertView:(UIAlertView *)alertView clickedButtonAtIndex:(NSInteger)buttonIndex
{
    if ([alertView.title isEqualToString:@"Save Changes"]){
        if (buttonIndex == 1){
            [self savePreferences];
        } else {
            _needToBeSaved = NO;
            [self goHome];
        }
    } else if ([alertView.title isEqualToString:@"Preferences"] && IDIOM != IPAD){
        if (buttonIndex == 0){
            NSDictionary *phoneInfo = [[[VDGTodayDashboardStore sharedStore] phoneNumbers] objectForKey:@"VDG-BT"];
            NSString *phoneString = [NSString stringWithFormat:@"tel:630-434-%@",phoneInfo[@"Phone"]];
            [[UIApplication sharedApplication] openURL:[NSURL URLWithString:phoneString]];
        }
    }
}

- (IBAction)showDescription:(id)sender {
    UIButton *infoButton = (UIButton *)sender;
    NSString *alertMessage = @"This is the help text";
    NSString *alertTitle = @"Help Title";
    if (infoButton.tag == 0){
        alertMessage = @"If this option is turned off (gray in color), Requests submitted using the app will include personal information entered above. Information provided will only be used in relation to requests submitted using the app and for notifications sent out on behalf of the Village of Downers Grove and this app.";
        alertTitle = @"Personal Information";
    } else if (infoButton.tag == 1) {
        alertMessage = @"If email is provided, email will be sent to this address for items related to requests submitted using this app and other Village news and information.";
        alertTitle = @"Email Notifications";
    } else if (infoButton.tag == 2) {
        alertMessage = @"Notifications will be sent to your phone for items like the Village's response to requests submitted through the app and also, for Village-wide and area-specific notices.";
        alertTitle = @"App Notifications";
    }
    UIAlertView *descriptionInfo = [[UIAlertView alloc]initWithTitle:alertTitle message:alertMessage delegate:nil cancelButtonTitle:@"OK" otherButtonTitles:nil];
    descriptionInfo.tag = 1011;
    [descriptionInfo show];
}
@end
