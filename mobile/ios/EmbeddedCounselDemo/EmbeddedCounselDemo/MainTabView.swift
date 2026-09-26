//
//  MainTabView.swift
//  EmbeddedCounselDemo
//
//  Created by Counsel on 5/1/25.
//

import SwiftUI

enum TabSelection: Hashable {
  case home, chat, account
}

struct MainTabView: View {
    @EnvironmentObject var navigationCoordinator: NavigationCoordinator
    @AppStorage("token") private var token: String?
    
    var body: some View {
        ZStack {
            // TabView(selection: $navigationCoordinator.selectedTab) {
            //     Tab("", systemImage: "house", value: .home) {
            //         HomeView(tabSelection: $navigationCoordinator.selectedTab)
            //     }
            //     Tab("", systemImage: "bubble", value: .chat) {
            //         ChatView()
            //     }
            //     Tab("", systemImage: "person", value: .account) {
            //         AccountView(presentAccessCodeModal: $navigationCoordinator.presentAccessCodeModal, tabSelection: $navigationCoordinator.selectedTab)
            //     }
            // }
            VStack(spacing: 0) {
               // Header with close button
               HStack {
                   Spacer()
                   // Close button that does nothing just for styling
                   Image(systemName: "xmark")
                           .font(.system(size: 16, weight: .medium))
                           .foregroundColor(.primary)
                           .frame(width: 30, height: 30)
                           .background(Color(.systemGray5))
                           .clipShape(Circle())
               }
               .padding(.horizontal, 10)
               .frame(height: 40)
               .background(Color(.systemBackground))
               .overlay(
                   Rectangle()
                       .frame(height: 1)
                       .foregroundColor(Color(.separator)),
                   alignment: .bottom
               )
               ChatView()
           }

            if navigationCoordinator.presentAccessCodeModal && token == nil {
                AccessCodeView(isPresented: $navigationCoordinator.presentAccessCodeModal)
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                    .background(Color.white)
            }
        }
    }
}
