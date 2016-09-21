//
//  VDGDetailViewController.m
//  Downers Now
//
//  Created by Joseph Kopinski on 5/22/15.
//  Copyright (c) 2015 Village of Downers Grove. All rights reserved.
//

#import "VDGDetailViewController.h"

@interface VDGDetailViewController ()

@property (weak, nonatomic) IBOutlet UITextView *textView;

@end

@implementation VDGDetailViewController

- (void)viewDidLoad {
    [super viewDidLoad];
    // Do any additional setup after loading the view.
    self.textView.text = self.detailText;
}

- (void)didReceiveMemoryWarning {
    [super didReceiveMemoryWarning];
    // Dispose of any resources that can be recreated.
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
