//
//  VDGIntroViewController.h
//  
//
//  Created by Joseph Kopinski on 6/11/15.
//
//

#import <UIKit/UIKit.h>
#import "VDGIntroWebViewController.h"

@interface VDGIntroViewController : UIViewController

@property (strong,nonatomic) UIPageViewController *pageViewController;

@property (weak, nonatomic) IBOutlet UIButton *leftButton;
- (IBAction)leftButtonPressed:(id)sender;
@property (weak, nonatomic) IBOutlet UIButton *rightButton;


@end
