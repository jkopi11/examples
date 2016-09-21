//
//  VDGIntroViewController.m
//  
//
//  Created by Joseph Kopinski on 6/11/15.
//
//

#import "VDGIntroViewController.h"

@interface VDGIntroViewController () <UIPageViewControllerDataSource, UIPageViewControllerDelegate>

@property (strong, nonatomic) NSArray *pages;

@end

@implementation VDGIntroViewController

- (void)viewDidLoad {
    [super viewDidLoad];
    // Do any additional setup after loading the view.
    NSString *pageOne = [self wrapHTMLFor:@"<p class=\"text-center\"><img class=\"img-rounded intro-logo\" src=\"AppIcon.png\" class=\"img-rounded\"/><p class=\"lead text-center\">Welcome</p><p class=\"text-center\">to the <br>Village of Downers Grove's <br>Mobile App</p>"];
    NSString *pageTwo = [self wrapHTMLFor:@"<p class=\"text-center\">With the Downers Now app, the Village is taking the next step to communicate better with you, the resident, business owner, or patron of the Village.</p>"];
    NSString *pageThree = [self wrapHTMLFor:@"<p class=\"text-center\">The Village plans on using this app to make your experience more personal and to also give you one central location for all Village related items.</p>"];
    NSString *pageFour = [self wrapHTMLFor:@"<p class=\"text-center\">Using the location of your address, the Village can send notifications for items in your area of the Village whether it's a zoning hearing for a new development or a road closure that could affect your commute to work.</p>"];
    NSString *pageFive = [self wrapHTMLFor:@"<p class=\"text-center\">In the event of an emergency, the Village plans to use this app to keep you updated on the Village's activites and to keep you informed of other resources that may help in a time of need.</p>"];
    NSString *pageSix = [self wrapHTMLFor:@"<p class=\"text-center\">Currently, the app is set to not deliver any notifications and to submit requests made through the app anonymously. If you wish to change these settings, please use the \"Register\" link. Otherwise, press \"Skip\".</p>"];
    self.pages = @[pageOne,pageTwo,pageThree,pageFour,pageFive,pageSix];
    
    self.pageViewController = [self.storyboard instantiateViewControllerWithIdentifier:@"PageViewController"];
    self.pageViewController.dataSource = self;
    self.pageViewController.delegate = self;
    
    
    self.rightButton.hidden = YES;
    
    VDGIntroWebViewController *startingViewController = [self viewControllerAtIndex:0];
    NSArray *viewControllers = @[startingViewController];
    [self.pageViewController setViewControllers:viewControllers direction:UIPageViewControllerNavigationDirectionForward animated:NO completion:nil];
    
    // Change the size of page view controller
    self.pageViewController.view.frame = CGRectMake(0, 0, self.view.frame.size.width, self.view.frame.size.height - 44);
    
    [self addChildViewController:_pageViewController];
    [self.view addSubview:_pageViewController.view];
    [self.pageViewController didMoveToParentViewController:self];
}

- (void) viewWillAppear:(BOOL)animated
{
    self.title = @"";
}

- (void)didReceiveMemoryWarning {
    [super didReceiveMemoryWarning];
    // Dispose of any resources that can be recreated.
}

- (NSString *)wrapHTMLFor:(NSString *)body
{
    return [NSString stringWithFormat:@"<html><link rel=\"stylesheet\" href=\"bootstrap.min.css\" type=\"text/css\"/><link rel=\"stylesheet\" href=\"downers_now.css\" type=\"text/css\"/><body style=\"background-color:#FFFFFF;color:rgb(0,63,95);\"><div class=\"container\"><div class=\"row\"><div class=\"col-xs-12\"><p class=\"spacer\"></p>%@</div></div></div></body></html>",body];
}

- (VDGIntroWebViewController *)viewControllerAtIndex:(NSUInteger)index
{
    if (([self.pages count] == 0) || (index >= [self.pages count])) {
        return nil;
    }
    
    // Create a new view controller and pass suitable data.
    VDGIntroWebViewController *pageContentViewController = [self.storyboard instantiateViewControllerWithIdentifier:@"IntroPageContentViewController"];
    pageContentViewController.webpageHTML = self.pages[index];
    pageContentViewController.pageIndex = index;
    
    return pageContentViewController;
}

- (UIViewController *)pageViewController:(UIPageViewController *)pageViewController viewControllerBeforeViewController:(UIViewController *)viewController
{
    NSUInteger index = ((VDGIntroWebViewController*) viewController).pageIndex;
    
    if ((index == 0) || (index == NSNotFound)) {
        return nil;
    }
    
    index--;
    return [self viewControllerAtIndex:index];
}

- (UIViewController *)pageViewController:(UIPageViewController *)pageViewController viewControllerAfterViewController:(UIViewController *)viewController
{
    NSUInteger index = ((VDGIntroWebViewController*) viewController).pageIndex;
    
    if (index == NSNotFound) {
        return nil;
    }
    
    index++;
    if (index == [self.pages count]) {
        return nil;
    }
    return [self viewControllerAtIndex:index];
}

- (NSInteger)presentationCountForPageViewController:(UIPageViewController *)pageViewController
{
    return [self.pages count];
}

- (NSInteger)presentationIndexForPageViewController:(UIPageViewController *)pageViewController
{
    return 0;
}

- (void)pageViewController:(UIPageViewController *)pageViewController didFinishAnimating:(BOOL)finished previousViewControllers:(NSArray *)previousViewControllers transitionCompleted:(BOOL)completed
{
    VDGIntroWebViewController *currentView = (VDGIntroWebViewController *)[pageViewController.viewControllers objectAtIndex:0];
    if (currentView.pageIndex == self.pages.count - 1) {
        self.rightButton.hidden = NO;
    } else {
        self.rightButton.hidden = YES;
    }
}
/*
#pragma mark - Navigation

// In a storyboard-based application, you will often want to do a little preparation before navigation
- (void)prepareForSegue:(UIStoryboardSegue *)segue sender:(id)sender {
    // Get the new view controller using [segue destinationViewController].
    // Pass the selected object to the new view controller.
}
*/

- (IBAction)leftButtonPressed:(id)sender {
    [self.navigationController popViewControllerAnimated:YES];
}
@end
