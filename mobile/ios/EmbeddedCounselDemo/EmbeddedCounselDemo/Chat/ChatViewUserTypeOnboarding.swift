//
//  ChatViewOnboarding.swift
//  EmbeddedCounselDemo
//
//  Created by Counsel on 8/6/25.
//

import SwiftUI

// This view is used to show the WebView for UserType onboarding users only
// This will show the WebView for onboarding + chat with no native onboarding pages
struct ChatViewUserTypeOnboarding: View {
    let chatUrl: URL?
    @Binding var isLoading: Bool
    var onClose: () -> Void = {}


    var body: some View {
        NavigationStack {
            ZStack {
               if let chatUrl = chatUrl {
                    WebView(url: chatUrl, showLoadingScreen: $isLoading, onClose: onClose)
                        .ignoresSafeArea(.keyboard)
                        .ignoresSafeArea(edges: .bottom)
                }
                if isLoading {
                    // Loading screen is default state if no chat URL is available or onboarding is not shown
                    VStack(spacing: 0) {
                        ProgressView()
                            .scaleEffect(1.5)
                            .progressViewStyle(CircularProgressViewStyle(tint: .blue))
                    }
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                    .background(Color(red: 25.0 / 255.0, green: 25.0 / 255.0, blue: 28.0 / 255.0))
                    .zIndex(2)
                    .transition(.opacity)
                }
            }
            .animation(.easeOut(duration: 0.5), value: isLoading)
        }
    }
}
