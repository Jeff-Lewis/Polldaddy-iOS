
/*	this category adds the ability to grab the first responder
	set on any UIView and act upon it, such as resignFirstResponder	
 
 */

@implementation UIView (FindFirstResponder)
- (UIView *)findFirstResonder
{
    if (self.isFirstResponder) {        
        return self;     
    }
	
    for (UIView *subView in self.subviews) {
        UIView *firstResponder = [subView findFirstResonder];
		
        if (firstResponder != nil) {
            return firstResponder;
        }
    }
	
    return nil;
}
@end
