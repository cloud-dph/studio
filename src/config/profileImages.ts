
// Configuration for available profile images

export const profileImages = [
  { id: 'avatar1', url: 'https://img1.hotstarext.com/image/upload/w_200,h_200,c_fill/feature/profile/21.png', name: 'Abstract Blue', aiHint: 'abstract blue pattern' },
  { id: 'avatar2', url: 'https://img1.hotstarext.com/image/upload/w_200,h_200,c_fill/feature/profile/2.png', name: 'Abstract Green', aiHint: 'abstract green pattern' },
  { id: 'avatar3', url: 'https://picsum.photos/200/200?random=1', name: 'Random Nature', aiHint: 'nature landscape' },
  { id: 'avatar4', url: 'https://picsum.photos/200/200?random=2', name: 'Geometric Shapes', aiHint: 'geometric shapes pattern' },
  { id: 'avatar5', url: 'https://picsum.photos/200/200?random=3', name: 'City Lights', aiHint: 'city lights night' },
  { id: 'avatar6', url: 'https://picsum.photos/200/200?random=4', name: 'Mountain Peak', aiHint: 'mountain peak snow' },
  { id: 'avatar7', url: 'https://picsum.photos/200/200?random=5', name: 'Ocean Wave', aiHint: 'ocean wave crashing' },
  { id: 'avatar8', url: 'https://picsum.photos/200/200?random=6', name: 'Forest Path', aiHint: 'forest path trees' },
];

// Specific image for the Kids profile
export const kidsProfileImage = {
    id: 'kids-avatar', // Identifier for the kids avatar itself
    url: 'https://picsum.photos/200/200?random=99', // Replace with a suitable Kids avatar URL
    name: 'Kids Avatar',
    aiHint: 'cartoon character kids friendly',
};
// Note: The 'Kids' profile itself will have the ID 'kids', but it will use this image URL.
