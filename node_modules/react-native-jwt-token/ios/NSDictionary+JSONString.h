//
//  NSDictionary+JSONString.h
//  RNJwtToken
//
//  Created by Dang Hung on 12/25/17.
//  Copyright © 2017 Facebook. All rights reserved.
//

#import <Foundation/Foundation.h>

@interface NSDictionary (JSONString)
-(NSString*) jsonStringWithPrettyPrint:(BOOL) prettyPrint;
@end
