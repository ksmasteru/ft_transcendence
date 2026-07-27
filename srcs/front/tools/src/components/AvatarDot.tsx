export function AvatarDot( { children }: { children: JSX.Element } ) {
	// TODO: add online status to the avatar dot based on the user's online status
	
	return (
		<div className="relative inline-block">
			{children}
      <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-800"></span>
    </div>
  );
}
