//
//  DGHttpClient.h
//  Downers Now
//
//  Created by Joseph Kopinski on 3/5/15.
//  Copyright (c) 2015 Village of Downers Grove. All rights reserved.
//

#import <Foundation/Foundation.h>

@interface DGHttpClient : NSObject

- (NSURLSessionDataTask *)GET:(NSString *)URLString
                   parameters:(NSDictionary *)parameters
                handleRefresh:(BOOL)handleRefresh
            completionHandler:(void (^)(NSData *task, id responseObject, NSError *))completionHandler;

@end
