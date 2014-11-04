jQuery( document ).ready( function($) {
	// Resize the body to the height of the form - this stops potential bouncing
	$( 'body' ).height( $( 'form' ).height() );

	// Multi-choice select
	$( '.PDF_question .PDF_QT400 li' ).on( 'tap', function() {
		var input = $( this ).find( 'input' );

		$( input ).prop( 'checked', $( input ).is( ':checked' ) ? false : true );

		return false;
	} );

	// Highlight 'other' radio button when clicking in the other text box
	$( '.PDF_QT400 input.other' ).on( 'focus', function() {
		$( '#' + $( this ).data( 'for' ) ).attr( 'checked', true );
	} );

	// Select/deselect 'other' radio box when clicking out of text box
	$( '.PDF_QT400 input.other' ).on( 'blur', function() {
		if ( $( this ).val() == '' )
			$( '#' + $( this ).data( 'for' ) ).attr( 'checked', false );
		else
			$( '#' + $( this ).data( 'for' ) ).attr( 'checked', true );
	} );

	// Hook into form submission so that we just hide the keyboard and prevent actual submission
	$( 'form' ).submit( function() {
		document.activeElement.blur();
		return false;
	} );
} );

// Get rid of jQuery mobile loading message
jQuery( document ).bind( 'mobileinit', function() {
	$.extend( $.mobile, {
		loadingMessage: false
	} );
} );

// General API to get data from form into Objective C
function get_data() {
	return $( 'form' ).serialize();
}
