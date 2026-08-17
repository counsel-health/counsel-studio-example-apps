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
    @State private var showChatSheet: Bool = false
    @State private var lastNonChatTab: TabSelection = .home

    private var tabBinding: Binding<TabSelection> {
        Binding(
            get: { navigationCoordinator.selectedTab },
            set: { newValue in
                if newValue == .chat {
                    showChatSheet = true
                } else {
                    lastNonChatTab = newValue
                    navigationCoordinator.selectedTab = newValue
                }
            }
        )
    }

    var body: some View {
        ZStack {
            TabView(selection: tabBinding) {
                Tab("", systemImage: "house", value: .home) {
                    HomeView(tabSelection: $navigationCoordinator.selectedTab)
                }
                Tab("", systemImage: "bubble", value: .chat) {
                    Color.clear
                }
                Tab("", systemImage: "person", value: .account) {
                    AccountView(presentAccessCodeModal: $navigationCoordinator.presentAccessCodeModal, tabSelection: $navigationCoordinator.selectedTab)
                }
            }
            .sheet(isPresented: $showChatSheet) {
                navigationCoordinator.selectedTab = lastNonChatTab
            } content: {
                ChatView()
                    .presentationDetents([.large])
                    .presentationBackground(Color(red: 34.0 / 255.0, green: 34.0 / 255.0, blue: 34.0 / 255.0))
                    .ignoresSafeArea(edges: .bottom)
            }
            .onChange(of: navigationCoordinator.selectedTab) { _, newValue in
                if newValue == .chat {
                    showChatSheet = true
                    navigationCoordinator.selectedTab = lastNonChatTab
                } else {
                    lastNonChatTab = newValue
                }
            }

            if navigationCoordinator.presentAccessCodeModal && token == nil {
                AccessCodeView(isPresented: $navigationCoordinator.presentAccessCodeModal)
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                    .background(Color.white)
            }
        }
    }
}
