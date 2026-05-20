import React, { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, StyleProp, Text, TextStyle, View } from 'react-native';

interface Props {
  text: string;
  style?: StyleProp<TextStyle>;
  active?: boolean;
  speed?: number; // px per second
}

export default function MarqueeText({ text, style, active = true, speed = 40 }: Props) {
  const translateX = useRef(new Animated.Value(0)).current;
  const [containerWidth, setContainerWidth] = useState(0);
  const [textWidth, setTextWidth] = useState(0);
  const animRef = useRef<Animated.CompositeAnimation | null>(null);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (!active || reduceMotion || textWidth === 0 || containerWidth === 0 || textWidth <= containerWidth) {
      translateX.setValue(0);
      return;
    }

    const distance = textWidth + 32; // gap between repeats
    const duration = (distance / speed) * 1000;

    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(1200),
        Animated.timing(translateX, {
          toValue: -distance,
          duration,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.delay(400),
        Animated.timing(translateX, { toValue: 0, duration: 0, useNativeDriver: true }),
      ])
    );
    animRef.current = loop;
    loop.start();
    return () => { loop.stop(); translateX.setValue(0); };
  }, [active, reduceMotion, textWidth, containerWidth, speed]);

  const needsMarquee = active && !reduceMotion && textWidth > containerWidth && containerWidth > 0;

  return (
    <View
      style={{ overflow: 'hidden' }}
      onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
    >
      {needsMarquee ? (
        <Animated.View style={{ flexDirection: 'row', transform: [{ translateX }] }}>
          <Text style={style} onLayout={(e) => setTextWidth(e.nativeEvent.layout.width)} numberOfLines={1}>
            {text}
          </Text>
          <Text style={[style, { paddingLeft: 32 }]} numberOfLines={1}>{text}</Text>
        </Animated.View>
      ) : (
        <Text
          style={style}
          numberOfLines={1}
          onLayout={(e) => setTextWidth(e.nativeEvent.layout.width)}
        >
          {text}
        </Text>
      )}
    </View>
  );
}
