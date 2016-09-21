//
//  DGHttpClient.m
//  Downers Now
//
//  Created by Joseph Kopinski on 3/5/15.
//  Copyright (c) 2015 Village of Downers Grove. All rights reserved.
//

#import "DGHttpClient.h"

NSString *VDGNowClientDomain = @"com.downers.mobile.DownersNow";

@interface DGHttpClient () <NSURLSessionDelegate>

@property (nonatomic) NSURLSession *session;

@end

@implementation DGHttpClient

- (NSURLSession *)getURLSession{
    if (!_session){
        NSURLSessionConfiguration *defaultConfigObject = [NSURLSessionConfiguration defaultSessionConfiguration];
        _session = [NSURLSession sessionWithConfiguration: defaultConfigObject delegate: self delegateQueue: [NSOperationQueue mainQueue]];
    }
    
    return _session;
    
}

- (NSURLSessionDataTask *)GET:(NSString *)URLString
                   parameters:(NSDictionary *)parameters
                handleRefresh:(BOOL)handleRefresh
            completionHandler:(void (^)(NSData *task, id responseObject, NSError *))completionHandler
{
    return [self GET:URLString parameters:parameters handleRefresh:handleRefresh retriesRemaining:5 delayInSeconds:1.0f completionHandler:completionHandler];
}

- (NSURLSessionDataTask *)GET:(NSString *)URLString
                   parameters:(NSDictionary *)parameters
                handleRefresh:(BOOL)handleRefresh
             retriesRemaining:(NSUInteger)retriesRemaining
               delayInSeconds:(double)delayInSeconds
            completionHandler:(void (^)(NSData *, id, NSError *))completionHandler
{
    
    NSString *method = @"GET";
    NSString *jsonString = [self getEncodedQueryParametersFromDictionary:parameters];
    NSURL *url = [NSURL URLWithString:[NSString stringWithFormat:@"%@%@",URLString,jsonString]];
    
    
    NSLog(@"Request Data: %@",jsonString);
    NSLog(@"Request: %@",url);
    NSMutableURLRequest *request = [NSMutableURLRequest requestWithURL:url];
    __block NSURLSessionDataTask *task;
    /*NSURLSessionDataTask *dataTask = [[self getURLSession] dataTaskWithRequest:req
                                                 completionHandler: ^( NSData *data, NSURLResponse *response, NSError *error) {
                                                     //NSLog(@"Response:%@ %@\n", response, error);
                                                     if(error == nil)
                                                     {
                                                         NSString *dataString = [[NSString alloc] initWithData:data encoding:NSUTF8StringEncoding];
                                                         //NSLog(@"Data: %@", dataString);
                                                         //dataString = [dataString stringByReplacingOccurrencesOfString:@"'" withString:@"\""];
                                                         NSData *jsonData = [dataString dataUsingEncoding:NSUTF8StringEncoding];
                                                         
                                                         _dashboardData = [NSJSONSerialization JSONObjectWithData:jsonData options:NSJSONReadingMutableContainers error:nil];
                                                         [[NSNotificationCenter defaultCenter] postNotificationName:@"Dashboard" object:@"Data"];
                                                     }
                                                 }];*/
    
    void(^responseHandler)( NSData *data, NSURLResponse *response, NSError *error) = ^( NSData *data, NSURLResponse *response, NSError *error){
        if (completionHandler) {
            if (error) {
                NSLog(@"Network request GET %@ failed with error: %@", request.URL, error);
                NSHTTPURLResponse *httpResponse = (NSHTTPURLResponse *)response;
                
                if (nil == httpResponse) {
                    NSLog(@"No response from URL request.");
                    // URL Loading error (transport, timeout, DNS, etc).
                    // Fall through to retry logic
                } else {
                    NSLog(@"Request failed with server status: (%ld): %@", (long)httpResponse.statusCode, [NSHTTPURLResponse localizedStringForStatusCode:httpResponse.statusCode]);
                }
                
                if (retriesRemaining > 0) {
                    NSLog(@"Request is eligible for retry.");
                    NSLog(@"Retrying(remaining: %lu, delay: %f) %@ : %@", retriesRemaining - 1, delayInSeconds, method, request.URL);
                    dispatch_time_t popTime = dispatch_time(DISPATCH_TIME_NOW, (int64_t)(delayInSeconds * NSEC_PER_SEC));
                    dispatch_after(popTime, dispatch_get_main_queue(), ^(void){
                        [self GET:URLString parameters:parameters handleRefresh:handleRefresh retriesRemaining:retriesRemaining - 1 delayInSeconds:delayInSeconds * 2.0f completionHandler:completionHandler];
                    });
                    
                    return;
                } else {
                    NSLog(@"Request has failed after maximum retries.");
                }
                
                error = [NSError errorWithDomain:VDGNowClientDomain
                                            code:httpResponse.statusCode
                                        userInfo:@{ NSUnderlyingErrorKey: error}];
                
                NSLog(@"Sending error up");
                return completionHandler(data, response, error);
            }
            
            NSLog(@"Network request %@ : %@ completed successfully.", method, request.URL);
            NSHTTPURLResponse *httpResponse = (NSHTTPURLResponse *)response;
            if (nil == httpResponse) {
                NSLog(@"Missing response for request: %@ : %@", method, request.URL);
                NSError *missingResponseError = [NSError errorWithDomain:VDGNowClientDomain
                                                                    code:httpResponse.statusCode
                                                                userInfo:nil];
                return completionHandler(data, response, missingResponseError);
            }
            
            return completionHandler(data, response, nil);
        }
    };
    
    task = [[self getURLSession] dataTaskWithRequest:request completionHandler:responseHandler];
    [task resume];
    
    // TODO: return a proxy instead of the actual task, because it may retry the request if it fails
    return task;
}

- (NSString *)getEncodedQueryParametersFromDictionary:(NSDictionary *)dict
{
    NSString *result = @"";
    for (id key in dict){
        NSString *newParam = [NSString stringWithFormat:@"%@=%@&",key,[dict objectForKey:key]];
        result = [NSString stringWithFormat:@"%@%@",result,newParam];
    }
    result = [result substringToIndex:[result length]-1];
    NSLog(@"Query: %@",result);
    return [result stringByAddingPercentEscapesUsingEncoding:NSUTF8StringEncoding];
}

@end
