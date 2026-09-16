//
//  HomeView.swift
//  EmbeddedCounselDemo
//
//  Created by Counsel on 5/1/25.
//

import SwiftUI

struct HomeView: View {
    
    @Binding var tabSelection: TabSelection
    
    var body: some View {
        NavigationStack {
            VStack(alignment: .leading, spacing: 16) {
                Text("Here's an overview of your wellness journey.")
                    .foregroundStyle(.gray)
                    .fontWeight(.medium)
                HealthScoreCardView()
                CounselCardView(tabSelection: $tabSelection)
            }
            .padding(.horizontal)
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .top)
            .navigationTitle("Welcome back!")
            .background(Color(red: 25.0 / 255.0, green: 25.0 / 255.0, blue: 28.0 / 255.0).ignoresSafeArea())
        }
    }
}
