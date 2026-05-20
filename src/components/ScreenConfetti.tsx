import React, { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { Animated, Dimensions, StyleSheet, View } from 'react-native';

export interface ScreenConfettiHandle {
  fire: () => void;
}

const COLORS = ['#FF453A', '#FF9500', '#FFD60A', '#34C759', '#007AFF', '#BF5AF2', '#FF2D55'];
const PIECE_COUNT = 48;
const { width: W, height: H } = Dimensions.get('window');

interface Piece {
  id: number;
  x: Animated.Value;
  y: Animated.Value;
  rot: Animated.Value;
  op: Animated.Value;
  color: string;
  size: number;
  isCircle: boolean;
}

function makePieces(): Piece[] {
  return Array.from({ length: PIECE_COUNT }, (_, i) => ({
    id: i,
    x: new Animated.Value(W / 2),
    y: new Animated.Value(H / 2),
    rot: new Animated.Value(0),
    op: new Animated.Value(1),
    color: COLORS[i % COLORS.length],
    size: 6 + Math.random() * 8,
    isCircle: Math.random() > 0.5,
  }));
}

const ScreenConfetti = forwardRef<ScreenConfettiHandle>((_, ref) => {
  const [visible, setVisible] = useState(false);
  const pieces = useRef<Piece[]>(makePieces());

  useImperativeHandle(ref, () => ({
    fire() {
      pieces.current = makePieces();
      setVisible(true);

      const animations = pieces.current.map((p) => {
        const angle = (Math.random() * Math.PI * 2);
        const distance = 120 + Math.random() * 200;
        const targetX = W / 2 + Math.cos(angle) * distance * (W / 300);
        const targetY = H / 2 + Math.sin(angle) * distance - 100;
        const duration = 900 + Math.random() * 600;

        return Animated.parallel([
          Animated.timing(p.x, { toValue: targetX, duration, useNativeDriver: true }),
          Animated.timing(p.y, { toValue: targetY + H * 0.4, duration, useNativeDriver: true }),
          Animated.timing(p.rot, { toValue: Math.random() * 720 - 360, duration, useNativeDriver: true }),
          Animated.sequence([
            Animated.delay(duration * 0.5),
            Animated.timing(p.op, { toValue: 0, duration: duration * 0.5, useNativeDriver: true }),
          ]),
        ]);
      });

      Animated.stagger(12, animations).start(() => setVisible(false));
    },
  }));

  if (!visible) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {pieces.current.map((p) => (
        <Animated.View
          key={p.id}
          style={{
            position: 'absolute',
            width: p.size,
            height: p.size,
            borderRadius: p.isCircle ? p.size / 2 : 2,
            backgroundColor: p.color,
            opacity: p.op,
            transform: [
              { translateX: p.x },
              { translateY: p.y },
              { rotate: p.rot.interpolate({ inputRange: [-360, 360], outputRange: ['-360deg', '360deg'] }) },
            ],
          }}
        />
      ))}
    </View>
  );
});

export default ScreenConfetti;
