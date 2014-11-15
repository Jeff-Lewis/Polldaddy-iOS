//
//  UI_Url.m
//  Polldaddy
//
//  Created by Eoin Gallagher on 27/05/2010.
//  Copyright 2010 Automattic. All rights reserved.
//

#import <QuartzCore/QuartzCore.h> 
#import "QuestionsViewController.h"
#import "UI_FileUpload.h"
#import "Question.h"
#import "ST_FileUpload.h"
#import "NSString+XMLEntities.h"
#import "Constants.h"
#import "PolldaddyAppDelegate.h"
#import "Language.h"

@implementation UI_FileUpload

@synthesize question;

- initWithQuestion:(ST_FileUpload *)theQuestion andPack:(Language *)thePack {
	self = [super init];
	
	dataFilePath = dataFileName = nil;
    pack = thePack;
	question = theQuestion;
	return self;
}

- (NSString *) getError {
	if ( [self isCompleted] == NO )
		return [pack getPhrase:PHRASE_MANDATORY];
	return @"";
}

- (boolean_t) isCompleted {
	return hasData;
}

- (boolean_t) isValid {
	return YES;
}

static const char _base64EncodingTable[64]   = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
/*  decoding table not currently used
static const short _base64DecodingTable[256] = {
	-2, -2, -2, -2, -2, -2, -2, -2, -2, -1, -1, -2, -1, -1, -2, -2,
	-2, -2, -2, -2, -2, -2, -2, -2, -2, -2, -2, -2, -2, -2, -2, -2,
	-1, -2, -2, -2, -2, -2, -2, -2, -2, -2, -2, 62, -2, -2, -2, 63,
	52, 53, 54, 55, 56, 57, 58, 59, 60, 61, -2, -2, -2, -2, -2, -2,
	-2, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14,
	15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, -2, -2, -2, -2, -2,
	-2, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40,
	41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, -2, -2, -2, -2, -2,
	-2, -2, -2, -2, -2, -2, -2, -2, -2, -2, -2, -2, -2, -2, -2, -2,
	-2, -2, -2, -2, -2, -2, -2, -2, -2, -2, -2, -2, -2, -2, -2, -2,
	-2, -2, -2, -2, -2, -2, -2, -2, -2, -2, -2, -2, -2, -2, -2, -2,
	-2, -2, -2, -2, -2, -2, -2, -2, -2, -2, -2, -2, -2, -2, -2, -2,
	-2, -2, -2, -2, -2, -2, -2, -2, -2, -2, -2, -2, -2, -2, -2, -2,
	-2, -2, -2, -2, -2, -2, -2, -2, -2, -2, -2, -2, -2, -2, -2, -2,
	-2, -2, -2, -2, -2, -2, -2, -2, -2, -2, -2, -2, -2, -2, -2, -2,
	-2, -2, -2, -2, -2, -2, -2, -2, -2, -2, -2, -2, -2, -2, -2, -2
};
*/
- (NSString *)encodeBase64WithData:(NSData *)objData {
	const unsigned char * objRawData = [objData bytes];
	char * objPointer;
	char * strResult;
	
	// Get the Raw Data length and ensure we actually have data
	long intLength = [objData length];
	if (intLength == 0) return nil;
	
	// Setup the String-based Result placeholder and pointer within that placeholder
	strResult = (char *)calloc(((intLength + 2) / 3) * 4, sizeof(char));
	objPointer = strResult;
	
	// Iterate through everything
	while (intLength > 2) { // keep going until we have less than 24 bits
		*objPointer++ = _base64EncodingTable[objRawData[0] >> 2];
		*objPointer++ = _base64EncodingTable[((objRawData[0] & 0x03) << 4) + (objRawData[1] >> 4)];
		*objPointer++ = _base64EncodingTable[((objRawData[1] & 0x0f) << 2) + (objRawData[2] >> 6)];
		*objPointer++ = _base64EncodingTable[objRawData[2] & 0x3f];
		
		// we just handled 3 octets (24 bits) of data
		objRawData += 3;
		intLength -= 3;
	}
	
	// now deal with the tail end of things
	if (intLength != 0) {
		*objPointer++ = _base64EncodingTable[objRawData[0] >> 2];
		if (intLength > 1) {
			*objPointer++ = _base64EncodingTable[((objRawData[0] & 0x03) << 4) + (objRawData[1] >> 4)];
			*objPointer++ = _base64EncodingTable[(objRawData[1] & 0x0f) << 2];
			*objPointer++ = '=';
		} else {
			*objPointer++ = _base64EncodingTable[(objRawData[0] & 0x03) << 4];
			*objPointer++ = '=';
			*objPointer++ = '=';
		}
	}
	
	// Terminate the string-based result
	*objPointer = '\0';
	
	// Return the results as an NSString object
    NSString * encoding = [NSString stringWithCString:strResult encoding:NSASCIIStringEncoding];
    
    //Free the strResult bytes
    if(strResult != NULL) {
        free(strResult);
    }
    
    return encoding;
}

- (NSString *) collectData {
	NSData *data;
	
	if ( hasData ) {
		if ( dataFilePath == nil ) {
			UIImage *viewImage;
			
			// Capture the draw area
			UIGraphicsBeginImageContext( drawImage.frame.size );
			
			[self.view.layer renderInContext:UIGraphicsGetCurrentContext()];
			
			viewImage = UIGraphicsGetImageFromCurrentImageContext();
			UIGraphicsEndImageContext();
			
			data = UIImageJPEGRepresentation( viewImage, 0.9 );

			dataFileName = [NSString stringWithFormat:@"fileupload-%f.jpg", [[NSDate date] timeIntervalSince1970]];
		}
		else {
			// Load image from disk
			data = [NSData dataWithContentsOfFile:dataFilePath];
			
			// Delete file in doc directory
			NSFileManager *manager = [NSFileManager defaultManager];
			
			[manager removeItemAtPath:dataFilePath error:nil];
		}		

		// Create the XML for my answer
		NSString *myData  = [NSString stringWithFormat:@"<raw>%@</raw><name>%@</name>", [self encodeBase64WithData:data], dataFileName];
		
		return myData;
	}
	
	return @"";
}

- (CGRect) getFrameRect {
	return CGRectMake( lastPoint.x, lastPoint.y, [self getMaxFrameWidth], [self getMaxFrameHeight] - lastPoint.y + 50 );
}

- (CGRect) getDrawRect {
	return CGRectMake( 0, 0, [self getMaxFrameWidth], floor( [self getMaxFrameHeight] - lastPoint.y ) );
}

- (CGRect) getCameraButtonRect {
	if ( [Constants isIpad] )
		return CGRectMake( [self getMaxFrameWidth] - 40, [self getMaxFrameHeight] - lastPoint.y + 5, 32, 32 );
	else
		return CGRectMake( [self getMaxFrameWidth] - 40, [self getMaxFrameHeight] - lastPoint.y + 5, 20, 20 );
}

- (CGRect) getClearButtonRect {
	if ( [Constants isIpad] )
		return CGRectMake( [self getMaxFrameWidth] - 40, [self getMaxFrameHeight] - lastPoint.y + 5, 32, 32 );
	else
		return CGRectMake( [self getMaxFrameWidth] - 40, [self getMaxFrameHeight] - lastPoint.y + 5, 20, 20 );
	//	if ( [Constants isIpad] )
//		return CGRectMake( [self getMaxFrameWidth] - 80, [self getMaxFrameHeight] - lastPoint.y + 5, 32, 32 );
//	else
//		return CGRectMake( [self getMaxFrameWidth] - 80, [self getMaxFrameHeight] - lastPoint.y + 5, 20, 20 );
}

// Implement viewDidLoad to do additional setup after loading the view, typically from a nib.
-(void) displayQuestion {
	// Without these the frame resizes to the height of the text field, meaning that it cuts off the 'hit' area of the field
	self.view.autoresizingMask    = NO;
	self.view.autoresizesSubviews = NO;

	hasData = NO;
	
	[self.view setFrame:[self getFrameRect]];
	
	drawImage = [[UIImageView alloc] initWithImage:nil];
	drawImage.backgroundColor = [UIColor whiteColor];
	
	[drawImage setContentMode:UIViewContentModeScaleAspectFit];
	drawImage.clipsToBounds = YES;
	
	[drawImage setFrame:[self getDrawRect]];
	[self.view addSubview:drawImage];

	// Camera button
//	cameraButton = [UIButton buttonWithType:UIButtonTypeCustom];
//	[cameraButton setFrame:[self getCameraButtonRect]];
//	
//	if ( [Constants isIpad] ) {
//		[cameraButton setImage:[UIImage imageNamed:@"photo-32.png"] forState:UIControlStateNormal];
//	}
//	else {
//		[cameraButton setImage:[UIImage imageNamed:@"photo-20.png"] forState:UIControlStateNormal];
//	}
//	
//	[cameraButton addTarget:self action:@selector(cameraButtonPress:) forControlEvents:UIControlEventTouchUpInside];
//	[self.view addSubview:cameraButton];

	// Clear button
	clearButton  = [UIButton buttonWithType:UIButtonTypeCustom];
	
	if ( [Constants isIpad] ) {
		[clearButton setImage:[UIImage imageNamed:@"clear-32.png"] forState:UIControlStateNormal];
	}
	else {
		[clearButton setImage:[UIImage imageNamed:@"clear-20.png"] forState:UIControlStateNormal];
	}

	[clearButton setFrame:[self getClearButtonRect]];
	[clearButton addTarget:self action:@selector(clearButtonPress:) forControlEvents:UIControlEventTouchUpInside];
	[self.view addSubview:clearButton];

	mouseMoved = 0;
}

- (void)imagePickerControllerDidCancel:(UIImagePickerController *)picker {
	[self.view setFrame:[self getFrameRect]];
	[drawImage setFrame:[self getDrawRect]];
	[drawImage setNeedsDisplay];
	[cameraButton setFrame:[self getCameraButtonRect]];
	[clearButton setFrame:[self getClearButtonRect]];
}

- (void)didReceiveMemoryWarning {
	// Releases the view if it doesn't have a superview.
	[super didReceiveMemoryWarning];
	NSLog(@"MEMORY WAWRNING");
	// Release any cached data, images, etc that aren't in use.
}

- (void)imagePickerController:(UIImagePickerController *)picker didFinishPickingMediaWithInfo:(NSDictionary *)info {
	UIImage *image = [info objectForKey:UIImagePickerControllerOriginalImage];

    [picker dismissViewControllerAnimated:YES completion:nil];
	
	dataFileName = [NSString stringWithFormat:@"fileupload-%f.jpg", [[NSDate date] timeIntervalSince1970]];
	
	// Now, we have to find the documents directory so we can save it
	NSArray  *paths = NSSearchPathForDirectoriesInDomains(NSDocumentDirectory, NSUserDomainMask, YES);
	NSString *documentsDirectory = [paths objectAtIndex:0];
	
	// Now we get the full path to the file
	dataFilePath = [documentsDirectory stringByAppendingPathComponent:@"upload.jpg"];
	
	// and then we write it out
	if ( [UIImageJPEGRepresentation( image, 0.9 ) writeToFile:dataFilePath atomically:NO] ) {
		// Load the image into the view area, disabling any sticky fingers
		drawImage.image = image;
		
		// Background is transparent now, otherwise we get borders
		drawImage.backgroundColor = [UIColor clearColor];		
	}
	else {
		UIAlertView *someError = [[UIAlertView alloc] initWithTitle:@"Error" message:@"Sorry, device is out of space and cannot store the image!" delegate:self cancelButtonTitle:@"Ok" otherButtonTitles: nil];
		[someError show];
		
		dataFileName = dataFilePath = nil;
	}

	hasData = YES;

	// Cancel the picker
	[self imagePickerControllerDidCancel:picker];
}

- (void)cameraButtonPress:(id)sender {
	PolldaddyAppDelegate *delegate = (PolldaddyAppDelegate *)[[UIApplication sharedApplication] delegate];

	// Create image picker controller
	UIImagePickerController *imagePicker = [[UIImagePickerController alloc] init];
	
	// Set source to the camera
	if ( [UIImagePickerController isSourceTypeAvailable:UIImagePickerControllerSourceTypeCamera] )
		imagePicker.sourceType = UIImagePickerControllerSourceTypeCamera;
	else
		imagePicker.sourceType = UIImagePickerControllerSourceTypeSavedPhotosAlbum;
		
	imagePicker.delegate      = self;
	imagePicker.allowsEditing = NO;

	// Show image picker
    [delegate.rootViewController presentViewController:imagePicker animated:YES completion:nil];
	
}

- (void)clearButtonPress:(id)sender {
	drawImage.image = nil;
	
	if ( dataFilePath ) {
		// Delete file in doc directory
		NSFileManager *manager = [NSFileManager defaultManager];
		
		[manager removeItemAtPath:dataFilePath error:nil];
	}
	
	
	hasData = NO;

	dataFilePath = dataFileName = nil;
	drawImage.backgroundColor = [UIColor whiteColor];
}

- (void)touchesBegan:(NSSet *)touches withEvent:(UIEvent *)event {
	if ( dataFilePath == nil ) {
		mouseSwiped = NO;
		UITouch *touch = [touches anyObject];
		
		lastMousePoint = [touch locationInView:self.view];
	}
}


- (void)touchesMoved:(NSSet *)touches withEvent:(UIEvent *)event {
	if ( dataFilePath == nil ) {
		mouseSwiped = YES;
		UITouch *touch = [touches anyObject];	
		CGPoint currentPoint = [touch locationInView:self.view];

		UIGraphicsBeginImageContext(drawImage.frame.size);
		
		[drawImage.image drawInRect:CGRectMake(0, 0, drawImage.frame.size.width, drawImage.frame.size.height)];
		
		CGContextSetLineCap(UIGraphicsGetCurrentContext(), kCGLineCapRound); //kCGLineCapSquare, kCGLineCapButt, kCGLineCapRound
		CGContextSetLineWidth(UIGraphicsGetCurrentContext(), 10.0); // for size
		CGContextSetLineJoin(UIGraphicsGetCurrentContext(), kCGLineJoinRound);
		CGContextSetRGBStrokeColor(UIGraphicsGetCurrentContext(), 0.5, 0.5, 0.5, 1.0); // RGBA
		CGContextBeginPath(UIGraphicsGetCurrentContext());
		CGContextMoveToPoint(UIGraphicsGetCurrentContext(), lastMousePoint.x, lastMousePoint.y);
		CGContextAddLineToPoint(UIGraphicsGetCurrentContext(), currentPoint.x, currentPoint.y);
		CGContextStrokePath(UIGraphicsGetCurrentContext());
		
		drawImage.image = UIGraphicsGetImageFromCurrentImageContext();
		UIGraphicsEndImageContext();
		
		lastMousePoint = currentPoint;
		
		hasData = YES;

		mouseMoved++;
		
		if (mouseMoved == 10) {
			mouseMoved = 0;
		}
	}
}

- (void)touchesEnded:(NSSet *)touches withEvent:(UIEvent *)event {	
	if ( dataFilePath == nil && !mouseSwiped ) {
		UIGraphicsBeginImageContext( drawImage.frame.size );

		[drawImage.image drawInRect:CGRectMake( 0, 0, drawImage.frame.size.width, drawImage.frame.size.height )];

		CGContextSetLineCap( UIGraphicsGetCurrentContext(), kCGLineCapRound );
		CGContextSetLineWidth( UIGraphicsGetCurrentContext(), 10.0 );
		CGContextSetLineJoin( UIGraphicsGetCurrentContext(), kCGLineJoinRound );
		CGContextSetRGBStrokeColor( UIGraphicsGetCurrentContext(), 0.5, 0.5, 0.5, 1.0 );   // RGBA
		CGContextMoveToPoint( UIGraphicsGetCurrentContext(), lastMousePoint.x, lastMousePoint.y );
		CGContextAddLineToPoint( UIGraphicsGetCurrentContext(), lastMousePoint.x, lastMousePoint.y );
		CGContextStrokePath( UIGraphicsGetCurrentContext() );
		CGContextFlush( UIGraphicsGetCurrentContext() );

		drawImage.image = UIGraphicsGetImageFromCurrentImageContext();
		
		hasData = YES;

		UIGraphicsEndImageContext();
	}
}

-(BOOL)shouldAutorotate {
    return YES;
}

-(NSUInteger)supportedInterfaceOrientations {
    return UIInterfaceOrientationMaskAll;
}

- (void)willAnimateRotationToInterfaceOrientation:(UIInterfaceOrientation)interfaceOrientation duration:(NSTimeInterval)duration{
	// Overriden to allow any orientation.
	[self.view setFrame:[self getFrameRect]];
	[drawImage setFrame:[self getDrawRect]];
	[drawImage setNeedsDisplay];
//	[cameraButton setFrame:[self getCameraButtonRect]];
	[clearButton setFrame:[self getClearButtonRect]];
}

- (void)dealloc {
	[clearButton removeFromSuperview];
//	[cameraButton removeFromSuperview];
	
	
}

@end
