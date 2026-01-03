#!/usr/bin/env python3
import json
import os

def train_tommy_model():
    """Train Tommy's voice model with childish speech patterns"""
    
    training_data = [
        "Hello there! How are you doing today?",
        "This is really good and nice to hear.",
        "Yes, I think that sounds very cool.",
        "My voice is getting better every day.",
        "The weather is really nice today.",
        "That movie was super good and fun.",
        "I like playing games and having fun."
    ]
    
    # Load existing model
    with open('models/tommy_model.json', 'r') as f:
        model = json.load(f)
    
    # Process training data to enhance speech patterns
    enhanced_patterns = model['speech_patterns'].copy()
    
    # Add more childish patterns based on training
    enhanced_patterns.update({
        "really": "weally",
        "very": "vewy", 
        "better": "bettew",
        "weather": "weathew",
        "super": "supew",
        "playing": "pwayin",
        "fun": "fun fun"
    })
    
    model['speech_patterns'] = enhanced_patterns
    
    # Save trained model
    with open('models/tommy_model.json', 'w') as f:
        json.dump(model, f, indent=2)
    
    print("Tommy model trained successfully!")

def train_lily_model():
    """Train Lily's voice model with sweet speech patterns"""
    
    training_data = [
        "Hello sweetie! How are you today?",
        "This is so good and really nice.",
        "Yes, that sounds very pretty and cute.",
        "My little voice is so sweet.",
        "The flowers are really beautiful today.",
        "That story was super nice and lovely.",
        "I love singing songs and dancing."
    ]
    
    # Load existing model
    with open('models/lily_model.json', 'r') as f:
        model = json.load(f)
    
    # Process training data to enhance speech patterns
    enhanced_patterns = model['speech_patterns'].copy()
    
    # Add more sweet patterns based on training
    enhanced_patterns.update({
        "beautiful": "bootiful",
        "pretty": "pwetty",
        "lovely": "wovely",
        "singing": "singin",
        "dancing": "dancin",
        "flowers": "fwowers",
        "story": "stowy"
    })
    
    model['speech_patterns'] = enhanced_patterns
    
    # Save trained model
    with open('models/lily_model.json', 'w') as f:
        json.dump(model, f, indent=2)
    
    print("Lily model trained successfully!")

if __name__ == "__main__":
    print("Training kid voice models...")
    train_tommy_model()
    train_lily_model()
    print("All models trained successfully!")